const express = require("express");

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