const express = require("express");
const crypto = require("crypto");

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
  description,
  entityType = "admin_account"
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
        entityType,
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
SECURITY SETTINGS HELPERS
=========================================================
*/

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

  const [createdRows] = await pool.execute(
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

  return createdRows[0];
};

const normalizeBoolean = (value) => {
  return (
    value === true ||
    value === "true" ||
    value === 1 ||
    value === "1"
  );
};

/*
=========================================================
GET ADMIN ACCESS SECURITY SETTINGS

GET /api/admin/security/access-settings
=========================================================
*/

router.get(
  "/access-settings",
  authenticateAdmin,
  requireSuperAdmin,
  async (req, res) => {
    try {
      const settings = await getOrCreateAccessSettings();

      return res.json({
        success: true,
        settings: {
          id: settings.id,
          mobile_access_enabled:
            Boolean(settings.mobile_access_enabled),
          ip_restriction_enabled:
            Boolean(settings.ip_restriction_enabled),
          mobile_access_code:
            settings.mobile_access_code || null,
          mobile_access_code_expires_at:
            settings.mobile_access_code_expires_at || null,
        },
      });
    } catch (error) {
      console.error(
        "GET ACCESS SECURITY SETTINGS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Unable to load access security settings.",
      });
    }
  }
);

/*
=========================================================
UPDATE ADMIN ACCESS SECURITY SETTINGS

PUT /api/admin/security/access-settings

Body:
{
  "mobile_access_enabled": true,
  "ip_restriction_enabled": false
}

Only Super Admin.
=========================================================
*/

router.put(
  "/access-settings",
  authenticateAdmin,
  requireSuperAdmin,
  async (req, res) => {
    try {
      const mobileAccessEnabled = normalizeBoolean(
        req.body?.mobile_access_enabled
      );

      const ipRestrictionEnabled = normalizeBoolean(
        req.body?.ip_restriction_enabled
      );

      const settings = await getOrCreateAccessSettings();

      await pool.execute(
        `
          UPDATE admin_access_settings
          SET
            mobile_access_enabled = ?,
            ip_restriction_enabled = ?
          WHERE id = ?
        `,
        [
          mobileAccessEnabled ? 1 : 0,
          ipRestrictionEnabled ? 1 : 0,
          settings.id,
        ]
      );

      await writeActivityLog(
        req,
        "ADMIN_ACCESS_SETTINGS_UPDATED",
        settings.id,
        `Super Administrator updated access security settings. Mobile access: ${
          mobileAccessEnabled ? "enabled" : "disabled"
        }; IP restriction: ${
          ipRestrictionEnabled ? "enabled" : "disabled"
        }.`,
        "admin_access_settings"
      );

      return res.json({
        success: true,
        message: "Access security settings updated successfully.",
      });
    } catch (error) {
      console.error(
        "UPDATE ACCESS SECURITY SETTINGS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Unable to update access security settings.",
      });
    }
  }
);

/*
=========================================================
GENERATE MOBILE ACCESS CODE

POST /api/admin/security/access-settings/generate-code

Body:
{
  "expires_in_minutes": 30
}

Default expiry: 30 minutes.
Maximum expiry: 24 hours.
=========================================================
*/

router.post(
  "/access-settings/generate-code",
  authenticateAdmin,
  requireSuperAdmin,
  async (req, res) => {
    try {
      const settings = await getOrCreateAccessSettings();

      let expiresInMinutes = Number(
        req.body?.expires_in_minutes
      );

      if (
        !Number.isFinite(expiresInMinutes) ||
        expiresInMinutes <= 0
      ) {
        expiresInMinutes = 30;
      }

      expiresInMinutes = Math.min(
        Math.floor(expiresInMinutes),
        1440
      );

      /*
        Six digit numeric access code.
      */
      const mobileAccessCode = String(
        crypto.randomInt(100000, 1000000)
      );

      const expiresAt = new Date(
        Date.now() +
          expiresInMinutes * 60 * 1000
      );

      await pool.execute(
        `
          UPDATE admin_access_settings
          SET
            mobile_access_code = ?,
            mobile_access_code_expires_at = ?
          WHERE id = ?
        `,
        [
          mobileAccessCode,
          expiresAt,
          settings.id,
        ]
      );

      await writeActivityLog(
        req,
        "MOBILE_ACCESS_CODE_GENERATED",
        settings.id,
        `Super Administrator generated a new mobile access code. Expiry: ${expiresInMinutes} minutes.`,
        "admin_access_settings"
      );

      return res.json({
        success: true,
        message: "Mobile access code generated successfully.",
        code: mobileAccessCode,
        expires_at: expiresAt,
        expires_in_minutes: expiresInMinutes,
      });
    } catch (error) {
      console.error(
        "GENERATE MOBILE ACCESS CODE ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Unable to generate mobile access code.",
      });
    }
  }
);

/*
=========================================================
CLEAR MOBILE ACCESS CODE

POST /api/admin/security/access-settings/clear-code
=========================================================
*/

router.post(
  "/access-settings/clear-code",
  authenticateAdmin,
  requireSuperAdmin,
  async (req, res) => {
    try {
      const settings = await getOrCreateAccessSettings();

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
        "MOBILE_ACCESS_CODE_CLEARED",
        settings.id,
        "Super Administrator cleared the mobile access code.",
        "admin_access_settings"
      );

      return res.json({
        success: true,
        message: "Mobile access code cleared successfully.",
      });
    } catch (error) {
      console.error(
        "CLEAR MOBILE ACCESS CODE ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Unable to clear mobile access code.",
      });
    }
  }
);

/*
=========================================================
GET ALLOWED IP ADDRESSES

GET /api/admin/security/allowed-ips
=========================================================
*/

router.get(
  "/allowed-ips",
  authenticateAdmin,
  requireSuperAdmin,
  async (req, res) => {
    try {
      const [ips] = await pool.execute(
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
        ips,
      });
    } catch (error) {
      console.error(
        "GET ALLOWED IPS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Unable to load allowed IP addresses.",
      });
    }
  }
);

/*
=========================================================
ADD ALLOWED IP

POST /api/admin/security/allowed-ips

Body:
{
  "ip_address": "127.0.0.1",
  "label": "Office Laptop"
}
=========================================================
*/

router.post(
  "/allowed-ips",
  authenticateAdmin,
  requireSuperAdmin,
  async (req, res) => {
    try {
      const rawIp = req.body?.ip_address;
      const rawLabel = req.body?.label;

      const ipAddress =
        typeof rawIp === "string"
          ? rawIp.trim()
          : "";

      const label =
        typeof rawLabel === "string" &&
        rawLabel.trim()
          ? rawLabel.trim()
          : null;

      if (!ipAddress) {
        return res.status(400).json({
          success: false,
          message: "IP address is required.",
        });
      }

      /*
        Basic IPv4 / IPv6 validation.
        Node's built-in net module is used instead
        of accepting arbitrary strings.
      */
      const net = require("net");

      if (!net.isIP(ipAddress)) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid IPv4 or IPv6 address.",
        });
      }

      const [existing] = await pool.execute(
        `
          SELECT
            id,
            ip_address,
            label,
            is_active
          FROM admin_allowed_ips
          WHERE ip_address = ?
          LIMIT 1
        `,
        [ipAddress]
      );

      if (existing.length) {
        return res.status(409).json({
          success: false,
          message: "This IP address already exists.",
          ip: existing[0],
        });
      }

      const [result] = await pool.execute(
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
        "ALLOWED_IP_ADDED",
        result.insertId,
        `Super Administrator added allowed IP ${ipAddress}${
          label ? ` (${label})` : ""
        }.`,
        "admin_allowed_ip"
      );

      return res.status(201).json({
        success: true,
        message: "Allowed IP address added successfully.",
        id: result.insertId,
      });
    } catch (error) {
      console.error(
        "ADD ALLOWED IP ERROR:",
        error
      );

      /*
        Handles the database unique index as well.
      */
      if (
        error?.code === "ER_DUP_ENTRY"
      ) {
        return res.status(409).json({
          success: false,
          message: "This IP address already exists.",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Unable to add allowed IP address.",
      });
    }
  }
);

/*
=========================================================
UPDATE ALLOWED IP

PUT /api/admin/security/allowed-ips/:id

Body:
{
  "label": "Office Laptop",
  "is_active": true
}
=========================================================
*/

router.put(
  "/allowed-ips/:id",
  authenticateAdmin,
  requireSuperAdmin,
  async (req, res) => {
    try {
      const ipId = Number(req.params.id);

      if (
        !Number.isInteger(ipId) ||
        ipId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid allowed IP ID.",
        });
      }

      const [existingRows] = await pool.execute(
        `
          SELECT
            id,
            ip_address,
            label,
            is_active
          FROM admin_allowed_ips
          WHERE id = ?
          LIMIT 1
        `,
        [ipId]
      );

      if (!existingRows.length) {
        return res.status(404).json({
          success: false,
          message: "Allowed IP address not found.",
        });
      }

      const existing = existingRows[0];

      const label =
        typeof req.body?.label === "string"
          ? req.body.label.trim() || null
          : existing.label;

      const isActive =
        req.body?.is_active === undefined
          ? Boolean(existing.is_active)
          : normalizeBoolean(
              req.body.is_active
            );

      await pool.execute(
        `
          UPDATE admin_allowed_ips
          SET
            label = ?,
            is_active = ?
          WHERE id = ?
        `,
        [
          label,
          isActive ? 1 : 0,
          ipId,
        ]
      );

      await writeActivityLog(
        req,
        isActive
          ? "ALLOWED_IP_ENABLED"
          : "ALLOWED_IP_DISABLED",
        ipId,
        `Super Administrator ${
          isActive ? "enabled" : "disabled"
        } allowed IP ${existing.ip_address}.`,
        "admin_allowed_ip"
      );

      return res.json({
        success: true,
        message: isActive
          ? "Allowed IP enabled successfully."
          : "Allowed IP disabled successfully.",
      });
    } catch (error) {
      console.error(
        "UPDATE ALLOWED IP ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Unable to update allowed IP address.",
      });
    }
  }
);

/*
=========================================================
DELETE ALLOWED IP

DELETE /api/admin/security/allowed-ips/:id
=========================================================
*/

router.delete(
  "/allowed-ips/:id",
  authenticateAdmin,
  requireSuperAdmin,
  async (req, res) => {
    try {
      const ipId = Number(req.params.id);

      if (
        !Number.isInteger(ipId) ||
        ipId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid allowed IP ID.",
        });
      }

      const [existingRows] = await pool.execute(
        `
          SELECT
            id,
            ip_address,
            label
          FROM admin_allowed_ips
          WHERE id = ?
          LIMIT 1
        `,
        [ipId]
      );

      if (!existingRows.length) {
        return res.status(404).json({
          success: false,
          message: "Allowed IP address not found.",
        });
      }

      const existing = existingRows[0];

      await pool.execute(
        `
          DELETE FROM admin_allowed_ips
          WHERE id = ?
        `,
        [ipId]
      );

      await writeActivityLog(
        req,
        "ALLOWED_IP_DELETED",
        ipId,
        `Super Administrator deleted allowed IP ${existing.ip_address}${
          existing.label
            ? ` (${existing.label})`
            : ""
        }.`,
        "admin_allowed_ip"
      );

      return res.json({
        success: true,
        message: "Allowed IP address deleted successfully.",
      });
    } catch (error) {
      console.error(
        "DELETE ALLOWED IP ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Unable to delete allowed IP address.",
      });
    }
  }
);

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

Body:
{
  "blocked": true
}

This is different from a security lock:
- Block = manual administrative deactivation
- Security lock = automatic security protection
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

Only Super Admin can unlock.

Resets:
- attempts = 3
- locked_at = NULL
- locked_ip = NULL
- lock_reason = NULL

Manual active/inactive status is not changed here.
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

module.exports = router;