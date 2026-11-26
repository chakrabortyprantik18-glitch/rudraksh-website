const express = require("express");
const crypto = require("crypto");
const net = require("net");

const { pool } = require("../config/db");
const { authenticateAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

/*
=========================================================
ADMIN SECURITY ROUTES

All routes in this file are Super Administrator only.

Mounted from server.js as:
  /api/admin/security
=========================================================
*/

const getRequesterId = (req) => {
  return (
    req.admin?.id ||
    req.admin?.adminId ||
    req.user?.id ||
    req.user?.adminId ||
    null
  );
};

const getClientIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"];

  if (forwarded) {
    return String(forwarded)
      .split(",")[0]
      .trim();
  }

  return (
    req.ip ||
    req.socket?.remoteAddress ||
    "unknown"
  );
};

const getUserAgent = (req) => {
  return req.headers["user-agent"] || "unknown";
};

const requireSuperAdmin = async (req, res, next) => {
  try {
    const requesterId = getRequesterId(req);

    if (!requesterId) {
      return res.status(401).json({
        success: false,
        message: "Administrator identity could not be verified.",
      });
    }

    const [rows] = await pool.execute(
      `
        SELECT
          id,
          username,
          name,
          role,
          is_active,
          locked_at
        FROM admins
        WHERE id = ?
        LIMIT 1
      `,
      [requesterId]
    );

    if (!rows.length) {
      return res.status(401).json({
        success: false,
        message: "Administrator account not found.",
      });
    }

    const currentAdmin = rows[0];

    if (!currentAdmin.is_active) {
      return res.status(403).json({
        success: false,
        message: "Your administrator account is inactive.",
      });
    }

    if (currentAdmin.locked_at) {
      return res.status(403).json({
        success: false,
        message: "Your administrator account is security locked.",
      });
    }

    if (currentAdmin.role !== "super_admin") {
      return res.status(403).json({
        success: false,
        message:
          "Super Administrator authorization is required for this action.",
      });
    }

    req.currentAdmin = currentAdmin;

    next();
  } catch (error) {
    console.error(
      "SUPER ADMIN AUTHORIZATION ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to verify administrator authorization.",
    });
  }
};

const writeActivityLog = async (
  req,
  action,
  entityId,
  description
) => {
  try {
    await pool.execute(
      `
        INSERT INTO activity_logs
        (
          admin_id,
          action,
          entity_type,
          entity_id,
          description,
          ip_address,
          user_agent
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        req.currentAdmin?.id || getRequesterId(req),
        action,
        "admin_account",
        entityId ? String(entityId) : null,
        description,
        getClientIp(req),
        getUserAgent(req),
      ]
    );
  } catch (error) {
    console.error(
      "ADMIN SECURITY ACTIVITY LOG ERROR:",
      error
    );
  }
};

/*
=========================================================
GET ACCOUNT SECURITY DETAILS

GET /api/admin/security/accounts/:id
=========================================================
*/

router.get(
  "/accounts/:id",
  authenticateAdmin,
  requireSuperAdmin,
  async (req, res) => {
    try {
      const accountId = Number(req.params.id);

      if (!Number.isInteger(accountId) || accountId <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid admin account ID.",
        });
      }

      const [accounts] = await pool.execute(
        `
          SELECT
            id,
            name,
            username,
            email,
            role,
            is_active,
            security_attempts_remaining,
            locked_at,
            locked_ip,
            lock_reason,
            last_login,
            created_at,
            updated_at
          FROM admins
          WHERE id = ?
          LIMIT 1
        `,
        [accountId]
      );

      if (!accounts.length) {
        return res.status(404).json({
          success: false,
          message: "Admin account not found.",
        });
      }

      const [logs] = await pool.execute(
        `
          SELECT
            id,
            action,
            entity_type,
            entity_id,
            description,
            ip_address,
            user_agent,
            created_at
          FROM activity_logs
          WHERE
            admin_id = ?
            OR (
              entity_type = 'admin_account'
              AND entity_id = ?
            )
          ORDER BY created_at DESC
          LIMIT 100
        `,
        [
          accountId,
          String(accountId),
        ]
      );

      return res.json({
        success: true,
        account: accounts[0],
        logs,
      });
    } catch (error) {
      console.error(
        "GET ADMIN SECURITY DETAILS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Unable to load account security details.",
      });
    }
  }
);

/*
=========================================================
MODIFY ADMIN ACCOUNT

PUT /api/admin/security/accounts/:id/profile

Allows Super Admin to change:
- name
- username
- email
- role

Super Admin account itself cannot be changed here.
=========================================================
*/

router.put(
  "/accounts/:id/profile",
  authenticateAdmin,
  requireSuperAdmin,
  async (req, res) => {
    try {
      const accountId = Number(req.params.id);

      if (!Number.isInteger(accountId) || accountId <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid admin account ID.",
        });
      }

      if (accountId === req.currentAdmin.id) {
        return res.status(403).json({
          success: false,
          message:
            "The Super Administrator account is protected.",
        });
      }

      const {
        name,
        username,
        email,
        role,
      } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Admin name is required.",
        });
      }

      if (!username || !username.trim()) {
        return res.status(400).json({
          success: false,
          message: "Username is required.",
        });
      }

      const allowedRoles = [
        "admin",
        "editor",
      ];

      const nextRole = allowedRoles.includes(role)
        ? role
        : "admin";

      const [targetRows] = await pool.execute(
        `
          SELECT
            id,
            name,
            username,
            email,
            role
          FROM admins
          WHERE id = ?
          LIMIT 1
        `,
        [accountId]
      );

      if (!targetRows.length) {
        return res.status(404).json({
          success: false,
          message: "Admin account not found.",
        });
      }

      const existing = targetRows[0];

      const [duplicateUsername] = await pool.execute(
        `
          SELECT id
          FROM admins
          WHERE username = ?
            AND id != ?
          LIMIT 1
        `,
        [
          username.trim(),
          accountId,
        ]
      );

      if (duplicateUsername.length) {
        return res.status(409).json({
          success: false,
          message: "That username is already in use.",
        });
      }

      if (email && email.trim()) {
        const [duplicateEmail] = await pool.execute(
          `
            SELECT id
            FROM admins
            WHERE email = ?
              AND id != ?
            LIMIT 1
          `,
          [
            email.trim(),
            accountId,
          ]
        );

        if (duplicateEmail.length) {
          return res.status(409).json({
            success: false,
            message: "That email is already in use.",
          });
        }
      }

      await pool.execute(
        `
          UPDATE admins
          SET
            name = ?,
            username = ?,
            email = ?,
            role = ?
          WHERE id = ?
        `,
        [
          name.trim(),
          username.trim(),
          email && email.trim()
            ? email.trim()
            : null,
          nextRole,
          accountId,
        ]
      );

      await writeActivityLog(
        req,
        "ADMIN_ACCOUNT_MODIFIED",
        accountId,
        `Super Administrator modified admin account #${accountId}. Username: ${existing.username} → ${username.trim()}; role: ${existing.role} → ${nextRole}.`
      );

      return res.json({
        success: true,
        message: "Admin account modified successfully.",
      });
    } catch (error) {
      console.error(
        "MODIFY ADMIN ACCOUNT ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Unable to modify admin account.",
      });
    }
  }
);

/*
=========================================================
MANUAL BLOCK / UNBLOCK

PUT /api/admin/security/accounts/:id/status
=========================================================
*/

router.put(
  "/accounts/:id/status",
  authenticateAdmin,
  requireSuperAdmin,
  async (req, res) => {
    try {
      const accountId = Number(req.params.id);

      if (!Number.isInteger(accountId) || accountId <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid admin account ID.",
        });
      }

      if (accountId === req.currentAdmin.id) {
        return res.status(403).json({
          success: false,
          message:
            "You cannot block your own Super Administrator account.",
        });
      }

      const blocked =
        req.body.blocked === true ||
        req.body.blocked === "true" ||
        req.body.blocked === 1 ||
        req.body.blocked === "1";

      const [result] = await pool.execute(
        `
          UPDATE admins
          SET is_active = ?
          WHERE id = ?
            AND role != 'super_admin'
        `,
        [
          blocked ? 0 : 1,
          accountId,
        ]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message:
            "Admin account not found or protected.",
        });
      }

      await writeActivityLog(
        req,
        blocked
          ? "ADMIN_ACCOUNT_BLOCKED"
          : "ADMIN_ACCOUNT_UNBLOCKED",
        accountId,
        blocked
          ? `Super Administrator manually blocked admin account #${accountId}.`
          : `Super Administrator manually unblocked admin account #${accountId}.`
      );

      return res.json({
        success: true,
        message: blocked
          ? "Admin account blocked successfully."
          : "Admin account unblocked successfully.",
      });
    } catch (error) {
      console.error(
        "ADMIN ACCOUNT STATUS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Unable to change admin account status.",
      });
    }
  }
);

/*
=========================================================
UNLOCK SECURITY LOCK

PUT /api/admin/security/accounts/:id/unlock
=========================================================
*/

router.put(
  "/accounts/:id/unlock",
  authenticateAdmin,
  requireSuperAdmin,
  async (req, res) => {
    try {
      const accountId = Number(req.params.id);

      if (!Number.isInteger(accountId) || accountId <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid admin account ID.",
        });
      }

      if (accountId === req.currentAdmin.id) {
        return res.status(403).json({
          success: false,
          message:
            "The Super Administrator account does not require a security unlock.",
        });
      }

      const [result] = await pool.execute(
        `
          UPDATE admins
          SET
            security_attempts_remaining = 3,
            locked_at = NULL,
            locked_ip = NULL,
            lock_reason = NULL
          WHERE id = ?
            AND role != 'super_admin'
        `,
        [accountId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message:
            "Admin account not found or protected.",
        });
      }

      await writeActivityLog(
        req,
        "ADMIN_SECURITY_UNLOCKED",
        accountId,
        `Super Administrator unlocked admin account #${accountId} and reset security attempts to 3.`
      );

      return res.json({
        success: true,
        message:
          "Security lock removed and attempts reset to 3.",
      });
    } catch (error) {
      console.error(
        "ADMIN SECURITY UNLOCK ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Unable to unlock admin account.",
      });
    }
  }
);

/*
=========================================================
GET SECURITY HISTORY

GET /api/admin/security/accounts/:id/logs
=========================================================
*/

router.get(
  "/accounts/:id/logs",
  authenticateAdmin,
  requireSuperAdmin,
  async (req, res) => {
    try {
      const accountId = Number(req.params.id);

      if (!Number.isInteger(accountId) || accountId <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid admin account ID.",
        });
      }

      const [logs] = await pool.execute(
        `
          SELECT
            id,
            action,
            entity_type,
            entity_id,
            description,
            ip_address,
            user_agent,
            created_at
          FROM activity_logs
          WHERE
            admin_id = ?
            OR (
              entity_type = 'admin_account'
              AND entity_id = ?
            )
          ORDER BY created_at DESC
          LIMIT 200
        `,
        [
          accountId,
          String(accountId),
        ]
      );

      return res.json({
        success: true,
        logs,
      });
    } catch (error) {
      console.error(
        "GET ADMIN SECURITY LOGS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Unable to load security history.",
      });
    }
  }
);

/*
=========================================================
ADMIN ACCESS SECURITY CONTROLS

These controls are protected by:
1. authenticateAdmin
2. Super Administrator role
3. A separate password stored ONLY in the server
   environment as ADMIN_ACCESS_SETTINGS_PASSWORD
4. A short-lived in-memory access token

The password is intentionally NOT stored in frontend code,
localStorage, the database, or the React bundle.
=========================================================
*/

const accessUnlockSessions = new Map();
const ACCESS_UNLOCK_TTL_MS = 10 * 60 * 1000;

const getAccessSettingsPassword = () => {
  return String(
    process.env.ADMIN_ACCESS_SETTINGS_PASSWORD || ""
  );
};

const safePasswordMatches = (provided, expected) => {
  if (!provided || !expected) {
    return false;
  }

  const providedHash = crypto
    .createHash("sha256")
    .update(String(provided))
    .digest();

  const expectedHash = crypto
    .createHash("sha256")
    .update(String(expected))
    .digest();

  return crypto.timingSafeEqual(
    providedHash,
    expectedHash
  );
};

const cleanupAccessUnlockSessions = () => {
  const now = Date.now();

  for (const [token, session] of accessUnlockSessions.entries()) {
    if (session.expiresAt <= now) {
      accessUnlockSessions.delete(token);
    }
  }
};

const requireAccessSettingsUnlock = (req, res, next) => {
  cleanupAccessUnlockSessions();

  const accessToken = String(
    req.headers["x-access-settings-token"] || ""
  ).trim();

  if (!accessToken) {
    return res.status(423).json({
      success: false,
      message:
        "Admin access security is locked. Password verification is required.",
    });
  }

  const session = accessUnlockSessions.get(accessToken);
  const requesterId = getRequesterId(req);

  if (
    !session ||
    session.expiresAt <= Date.now() ||
    String(session.adminId) !== String(requesterId)
  ) {
    if (session) {
      accessUnlockSessions.delete(accessToken);
    }

    return res.status(423).json({
      success: false,
      message:
        "Admin access security unlock has expired. Enter the password again.",
    });
  }

  req.accessSecuritySession = session;
  next();
};

const getOrCreateAccessSettings = async () => {
  const [rows] = await pool.execute(
    `
      SELECT
        id,
        mobile_access_enabled,
        ip_restriction_enabled,
        mobile_access_code,
        mobile_access_code_expires_at
      FROM admin_access_settings
      ORDER BY id ASC
      LIMIT 1
    `
  );

  if (rows.length) {
    return rows[0];
  }

  await pool.execute(
    `
      INSERT INTO admin_access_settings
      (
        mobile_access_enabled,
        ip_restriction_enabled,
        mobile_access_code,
        mobile_access_code_expires_at
      )
      VALUES (0, 0, NULL, NULL)
    `
  );

  const [created] = await pool.execute(
    `
      SELECT
        id,
        mobile_access_enabled,
        ip_restriction_enabled,
        mobile_access_code,
        mobile_access_code_expires_at
      FROM admin_access_settings
      ORDER BY id ASC
      LIMIT 1
    `
  );

  return created[0];
};

const normalizeBoolean = (value) => {
  return (
    value === true ||
    value === 1 ||
    value === "1" ||
    value === "true" ||
    value === "TRUE" ||
    value === "on"
  ) ? 1 : 0;
};

/*
POST /api/admin/security/access-settings/unlock
*/

router.post(
  "/access-settings/unlock",
  authenticateAdmin,
  requireSuperAdmin,
  async (req, res) => {
    try {
      const expectedPassword = getAccessSettingsPassword();

      const providedPassword = String(
        req.body?.password || ""
      );

      if (!expectedPassword) {
        console.error(
          "ADMIN_ACCESS_SETTINGS_PASSWORD is not configured."
        );

        return res.status(500).json({
          success: false,
          message:
            "Admin access security password is not configured on the server.",
        });
      }

      if (
        !safePasswordMatches(
          providedPassword,
          expectedPassword
        )
      ) {
        await writeActivityLog(
          req,
          "ADMIN_ACCESS_SECURITY_UNLOCK_FAILED",
          null,
          "A failed attempt was made to unlock the Admin Access Security controls."
        );

        return res.status(401).json({
          success: false,
          message: "Invalid access password.",
        });
      }

      cleanupAccessUnlockSessions();

      const accessToken =
        crypto.randomBytes(32).toString("hex");

      const expiresAt =
        Date.now() + ACCESS_UNLOCK_TTL_MS;

      accessUnlockSessions.set(
        accessToken,
        {
          adminId: req.currentAdmin.id,
          expiresAt,
        }
      );

      await writeActivityLog(
        req,
        "ADMIN_ACCESS_SECURITY_UNLOCKED",
        null,
        "Super Administrator unlocked the Admin Access Security controls."
      );

      return res.json({
        success: true,
        access_token: accessToken,
        expires_at:
          new Date(expiresAt).toISOString(),
        message:
          "Admin access security unlocked.",
      });
    } catch (error) {
      console.error(
        "ADMIN ACCESS SECURITY UNLOCK ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to verify the access password.",
      });
    }
  }
);

/*
GET /api/admin/security/access-settings
*/

router.get(
  "/access-settings",
  authenticateAdmin,
  requireSuperAdmin,
  requireAccessSettingsUnlock,
  async (req, res) => {
    try {
      const settings =
        await getOrCreateAccessSettings();

      const [allowedIps] =
        await pool.execute(
          `
            SELECT
              id,
              ip_address,
              label,
              is_active,
              created_by,
              created_at
            FROM admin_allowed_ips
            ORDER BY created_at DESC, id DESC
          `
        );

      return res.json({
        success: true,
        settings,
        allowed_ips: allowedIps,
      });
    } catch (error) {
      console.error(
        "GET ADMIN ACCESS SETTINGS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load admin access security settings.",
      });
    }
  }
);

/*
PUT /api/admin/security/access-settings
*/

router.put(
  "/access-settings",
  authenticateAdmin,
  requireSuperAdmin,
  requireAccessSettingsUnlock,
  async (req, res) => {
    try {
      const current =
        await getOrCreateAccessSettings();

      const mobileAccessEnabled =
        req.body?.mobile_access_enabled === undefined
          ? Number(
              current.mobile_access_enabled
            )
          : normalizeBoolean(
              req.body.mobile_access_enabled
            );

      const ipRestrictionEnabled =
        req.body?.ip_restriction_enabled === undefined
          ? Number(
              current.ip_restriction_enabled
            )
          : normalizeBoolean(
              req.body.ip_restriction_enabled
            );

      await pool.execute(
        `
          UPDATE admin_access_settings
          SET
            mobile_access_enabled = ?,
            ip_restriction_enabled = ?
          WHERE id = ?
        `,
        [
          mobileAccessEnabled,
          ipRestrictionEnabled,
          current.id,
        ]
      );

      const settings =
        await getOrCreateAccessSettings();

      await writeActivityLog(
        req,
        "ADMIN_ACCESS_SECURITY_SETTINGS_UPDATED",
        current.id,
        `Admin access security settings updated. Mobile access: ${
          mobileAccessEnabled
            ? "enabled"
            : "disabled"
        }; IP restriction: ${
          ipRestrictionEnabled
            ? "enabled"
            : "disabled"
        }.`
      );

      const [allowedIps] =
        await pool.execute(
          `
            SELECT
              id,
              ip_address,
              label,
              is_active,
              created_by,
              created_at
            FROM admin_allowed_ips
            ORDER BY created_at DESC, id DESC
          `
        );

      return res.json({
        success: true,
        settings,
        allowed_ips: allowedIps,
        message:
          "Access security settings updated successfully.",
      });
    } catch (error) {
      console.error(
        "UPDATE ADMIN ACCESS SETTINGS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to update admin access security settings.",
      });
    }
  }
);

/*
POST /api/admin/security/access-settings/generate-code
*/

router.post(
  "/access-settings/generate-code",
  authenticateAdmin,
  requireSuperAdmin,
  requireAccessSettingsUnlock,
  async (req, res) => {
    try {
      const rawMinutes =
        Number(
          req.body?.expires_in_minutes ??
          req.body?.expires_minutes ??
          30
        );

      if (!Number.isFinite(rawMinutes)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid code expiry time.",
        });
      }

      const expiresInMinutes =
        Math.min(
          1440,
          Math.max(
            1,
            Math.floor(rawMinutes)
          )
        );

      const code = String(
        crypto.randomInt(
          100000,
          1000000
        )
      );

      const expiresAt =
        new Date(
          Date.now() +
          expiresInMinutes *
          60 *
          1000
        );

      const settings =
        await getOrCreateAccessSettings();

      await pool.execute(
        `
          UPDATE admin_access_settings
          SET
            mobile_access_code = ?,
            mobile_access_code_expires_at = ?
          WHERE id = ?
        `,
        [
          code,
          expiresAt,
          settings.id,
        ]
      );

      const updated =
        await getOrCreateAccessSettings();

      await writeActivityLog(
        req,
        "ADMIN_MOBILE_ACCESS_CODE_GENERATED",
        settings.id,
        `Super Administrator generated a temporary mobile access code with ${expiresInMinutes} minute expiry.`
      );

      return res.json({
        success: true,
        code,
        expires_at:
          expiresAt.toISOString(),
        settings: updated,
        message:
          "Mobile access code generated successfully.",
      });
    } catch (error) {
      console.error(
        "GENERATE MOBILE ACCESS CODE ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to generate mobile access code.",
      });
    }
  }
);

/*
POST /api/admin/security/access-settings/clear-code
*/

router.post(
  "/access-settings/clear-code",
  authenticateAdmin,
  requireSuperAdmin,
  requireAccessSettingsUnlock,
  async (req, res) => {
    try {
      const settings =
        await getOrCreateAccessSettings();

      await pool.execute(
        `
          UPDATE admin_access_settings
          SET
            mobile_access_code = NULL,
            mobile_access_code_expires_at = NULL
          WHERE id = ?
        `,
        [settings.id]
      );

      await writeActivityLog(
        req,
        "ADMIN_MOBILE_ACCESS_CODE_CLEARED",
        settings.id,
        "Super Administrator cleared the temporary mobile access code."
      );

      return res.json({
        success: true,
        message:
          "Mobile access code cleared.",
      });
    } catch (error) {
      console.error(
        "CLEAR MOBILE ACCESS CODE ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to clear mobile access code.",
      });
    }
  }
);

/*
GET /api/admin/security/allowed-ips
*/

router.get(
  "/allowed-ips",
  authenticateAdmin,
  requireSuperAdmin,
  requireAccessSettingsUnlock,
  async (req, res) => {
    try {
      const [allowedIps] =
        await pool.execute(
          `
            SELECT
              id,
              ip_address,
              label,
              is_active,
              created_by,
              created_at
            FROM admin_allowed_ips
            ORDER BY created_at DESC, id DESC
          `
        );

      return res.json({
        success: true,
        allowed_ips: allowedIps,
      });
    } catch (error) {
      console.error(
        "GET ALLOWED ADMIN IPS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load allowed IP addresses.",
      });
    }
  }
);

/*
POST /api/admin/security/allowed-ips
*/

router.post(
  "/allowed-ips",
  authenticateAdmin,
  requireSuperAdmin,
  requireAccessSettingsUnlock,
  async (req, res) => {
    try {
      const ipAddress =
        String(
          req.body?.ip_address || ""
        ).trim();

      const label =
        req.body?.label
          ? String(
              req.body.label
            ).trim()
          : null;

      if (!ipAddress) {
        return res.status(400).json({
          success: false,
          message:
            "IP address is required.",
        });
      }

      if (!net.isIP(ipAddress)) {
        return res.status(400).json({
          success: false,
          message:
            "Enter a valid IPv4 or IPv6 address.",
        });
      }

      const [existing] =
        await pool.execute(
          `
            SELECT id
            FROM admin_allowed_ips
            WHERE ip_address = ?
            LIMIT 1
          `,
          [ipAddress]
        );

      if (existing.length) {
        return res.status(409).json({
          success: false,
          message:
            "That IP address is already in the allowed list.",
        });
      }

      await pool.execute(
        `
          INSERT INTO admin_allowed_ips
          (
            ip_address,
            label,
            is_active,
            created_by
          )
          VALUES (?, ?, 1, ?)
        `,
        [
          ipAddress,
          label,
          req.currentAdmin.id,
        ]
      );

      await writeActivityLog(
        req,
        "ADMIN_ALLOWED_IP_ADDED",
        null,
        `Super Administrator added allowed IP ${ipAddress}${
          label
            ? ` (${label})`
            : ""
        }.`
      );

      const [allowedIps] =
        await pool.execute(
          `
            SELECT
              id,
              ip_address,
              label,
              is_active,
              created_by,
              created_at
            FROM admin_allowed_ips
            ORDER BY created_at DESC, id DESC
          `
        );

      return res.status(201).json({
        success: true,
        allowed_ips: allowedIps,
        message:
          "Allowed IP address added successfully.",
      });
    } catch (error) {
      console.error(
        "ADD ALLOWED ADMIN IP ERROR:",
        error
      );

      if (
        error?.code ===
        "ER_DUP_ENTRY"
      ) {
        return res.status(409).json({
          success: false,
          message:
            "That IP address is already in the allowed list.",
        });
      }

      return res.status(500).json({
        success: false,
        message:
          "Unable to add allowed IP address.",
      });
    }
  }
);

/*
PUT /api/admin/security/allowed-ips/:id
*/

router.put(
  "/allowed-ips/:id",
  authenticateAdmin,
  requireSuperAdmin,
  requireAccessSettingsUnlock,
  async (req, res) => {
    try {
      const ipId =
        Number(req.params.id);

      if (
        !Number.isInteger(ipId) ||
        ipId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid allowed IP ID.",
        });
      }

      const fields = [];
      const values = [];

      if (
        req.body?.ip_address !==
        undefined
      ) {
        const ipAddress =
          String(
            req.body.ip_address
          ).trim();

        if (!net.isIP(ipAddress)) {
          return res.status(400).json({
            success: false,
            message:
              "Enter a valid IPv4 or IPv6 address.",
          });
        }

        fields.push(
          "ip_address = ?"
        );

        values.push(
          ipAddress
        );
      }

      if (
        req.body?.label !==
        undefined
      ) {
        fields.push(
          "label = ?"
        );

        values.push(
          req.body.label === null
            ? null
            : String(
                req.body.label
              ).trim() || null
        );
      }

      if (
        req.body?.is_active !==
        undefined
      ) {
        fields.push(
          "is_active = ?"
        );

        values.push(
          normalizeBoolean(
            req.body.is_active
          )
        );
      }

      if (!fields.length) {
        return res.status(400).json({
          success: false,
          message:
            "No changes were provided.",
        });
      }

      values.push(ipId);

      const [result] =
        await pool.execute(
          `
            UPDATE admin_allowed_ips
            SET ${fields.join(", ")}
            WHERE id = ?
          `,
          values
        );

      if (!result.affectedRows) {
        return res.status(404).json({
          success: false,
          message:
            "Allowed IP address not found.",
        });
      }

      await writeActivityLog(
        req,
        "ADMIN_ALLOWED_IP_UPDATED",
        ipId,
        `Super Administrator updated allowed IP record #${ipId}.`
      );

      const [allowedIps] =
        await pool.execute(
          `
            SELECT
              id,
              ip_address,
              label,
              is_active,
              created_by,
              created_at
            FROM admin_allowed_ips
            ORDER BY created_at DESC, id DESC
          `
        );

      return res.json({
        success: true,
        allowed_ips: allowedIps,
        message:
          "Allowed IP updated successfully.",
      });
    } catch (error) {
      console.error(
        "UPDATE ALLOWED ADMIN IP ERROR:",
        error
      );

      if (
        error?.code ===
        "ER_DUP_ENTRY"
      ) {
        return res.status(409).json({
          success: false,
          message:
            "That IP address is already in the allowed list.",
        });
      }

      return res.status(500).json({
        success: false,
        message:
          "Unable to update allowed IP.",
      });
    }
  }
);

/*
DELETE /api/admin/security/allowed-ips/:id
*/

router.delete(
  "/allowed-ips/:id",
  authenticateAdmin,
  requireSuperAdmin,
  requireAccessSettingsUnlock,
  async (req, res) => {
    try {
      const ipId =
        Number(req.params.id);

      if (
        !Number.isInteger(ipId) ||
        ipId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid allowed IP ID.",
        });
      }

      const [result] =
        await pool.execute(
          `
            DELETE FROM admin_allowed_ips
            WHERE id = ?
          `,
          [ipId]
        );

      if (!result.affectedRows) {
        return res.status(404).json({
          success: false,
          message:
            "Allowed IP address not found.",
        });
      }

      await writeActivityLog(
        req,
        "ADMIN_ALLOWED_IP_REMOVED",
        ipId,
        `Super Administrator removed allowed IP record #${ipId}.`
      );

      const [allowedIps] =
        await pool.execute(
          `
            SELECT
              id,
              ip_address,
              label,
              is_active,
              created_by,
              created_at
            FROM admin_allowed_ips
            ORDER BY created_at DESC, id DESC
          `
        );

      return res.json({
        success: true,
        allowed_ips: allowedIps,
        message:
          "Allowed IP removed successfully.",
      });
    } catch (error) {
      console.error(
        "DELETE ALLOWED ADMIN IP ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to remove allowed IP.",
      });
    }
  }
);

module.exports = router;