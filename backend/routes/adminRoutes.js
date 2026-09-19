const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { pool } = require("../config/db");
const { authenticateAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

/* =========================================================
   HELPERS
========================================================= */

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];

  if (forwarded) {
    return String(forwarded).split(",")[0].trim();
  }

  return req.ip || req.socket?.remoteAddress || "unknown";
}

async function logActivity({
  adminId = null,
  action,
  entityType = null,
  entityId = null,
  description = null,
  req,
}) {
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
        adminId,
        action,
        entityType,
        entityId !== null ? String(entityId) : null,
        description,
        getClientIp(req),
        req.get("user-agent") || null,
      ]
    );
  } catch (error) {
    console.error("ACTIVITY LOG ERROR:", error);
  }
}

function requireSuperAdmin(req, res, next) {
  if (
    !req.admin ||
    req.admin.role !== "super_admin"
  ) {
    return res.status(403).json({
      success: false,
      message: "Super administrator access is required.",
    });
  }

  next();
}

/* =========================================================
   SECURITY STRIKE SYSTEM

   3 -> 2 -> 1 -> 0
   At 0 the account is locked.
========================================================= */

async function recordSecurityViolation(req, adminId, reason) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.execute(
      `
      SELECT
        id,
        role,
        security_attempts_remaining,
        locked_at
      FROM admins
      WHERE id = ?
      FOR UPDATE
      `,
      [adminId]
    );

    if (!rows.length) {
      await connection.rollback();

      return {
        success: false,
        remaining: 0,
        locked: false,
      };
    }

    const admin = rows[0];

    if (admin.role === "super_admin") {
      await connection.rollback();

      return {
        success: true,
        remaining: 3,
        locked: false,
        protected: true,
      };
    }

    if (admin.locked_at) {
      await connection.rollback();

      return {
        success: true,
        remaining: 0,
        locked: true,
      };
    }

    const current = Math.max(
      0,
      Number(admin.security_attempts_remaining ?? 3)
    );

    const remaining = Math.max(
      0,
      current - 1
    );

    const locked = remaining === 0;

    await connection.execute(
      `
      UPDATE admins
      SET
        security_attempts_remaining = ?,
        locked_at = CASE
          WHEN ? = 1 THEN NOW()
          ELSE locked_at
        END,
        locked_ip = CASE
          WHEN ? = 1 THEN ?
          ELSE locked_ip
        END,
        lock_reason = CASE
          WHEN ? = 1 THEN ?
          ELSE lock_reason
        END
      WHERE id = ?
      `,
      [
        remaining,
        locked ? 1 : 0,
        locked ? 1 : 0,
        getClientIp(req),
        locked ? 1 : 0,
        reason,
        adminId,
      ]
    );

    await connection.execute(
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
        adminId,
        locked
          ? "SECURITY_ACCOUNT_LOCKED"
          : "SECURITY_VIOLATION",
        "admin_account",
        String(adminId),
        locked
          ? `Security account automatically locked. Reason: ${reason}`
          : `Unauthorized security violation. ${remaining} attempt(s) remaining. Reason: ${reason}`,
        getClientIp(req),
        req.get("user-agent") || null,
      ]
    );

    await connection.commit();

    return {
      success: true,
      remaining,
      locked,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/* =========================================================
   LOGIN
========================================================= */

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required.",
      });
    }

    const [admins] = await pool.execute(
      `
      SELECT
        id,
        name,
        username,
        email,
        password_hash,
        role,
        is_active,
        security_attempts_remaining,
        locked_at,
        locked_ip,
        lock_reason
      FROM admins
      WHERE username = ?
      LIMIT 1
      `,
      [username.trim()]
    );

    if (!admins.length) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password.",
      });
    }

    const admin = admins[0];

    if (!admin.is_active) {
      return res.status(403).json({
        success: false,
        code: "ADMIN_BLOCKED",
        message:
          "This admin account has been blocked. Please contact the Super Admin.",
      });
    }

    if (
      admin.locked_at ||
      Number(admin.security_attempts_remaining) <= 0
    ) {
      return res.status(423).json({
        success: false,
        code: "ADMIN_SECURITY_LOCKED",
        message:
          "You have been blocked by the system. Your IP address has been marked as terminated. Please contact the Super Admin.",
        lock: {
          locked_at: admin.locked_at,
          locked_ip: admin.locked_ip,
          lock_reason: admin.lock_reason,
          attempts_remaining: Number(
            admin.security_attempts_remaining
          ),
        },
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      admin.password_hash
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password.",
      });
    }

    const token = jwt.sign(
      {
        id: admin.id,
        username: admin.username,
        role: admin.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    await pool.execute(
      `
      UPDATE admins
      SET last_login = NOW()
      WHERE id = ?
      `,
      [admin.id]
    );

    await logActivity({
      adminId: admin.id,
      action: "ADMIN_LOGIN",
      entityType: "admin",
      entityId: admin.id,
      description: "Administrator logged into the admin panel.",
      req,
    });

    return res.json({
      success: true,
      message: "Login successful.",
      token,
      admin: {
        id: admin.id,
        name: admin.name,
        username: admin.username,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("ADMIN LOGIN ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to process admin login.",
    });
  }
});

/* =========================================================
   ADMIN PROFILE
========================================================= */

router.get(
  "/me",
  authenticateAdmin,
  async (req, res) => {
    try {
      const [admins] = await pool.execute(
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
        [req.admin.id]
      );

      if (!admins.length) {
        return res.status(404).json({
          success: false,
          message: "Admin account not found.",
        });
      }

      return res.json({
        success: true,
        admin: admins[0],
      });
    } catch (error) {
      console.error("ADMIN PROFILE ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to load admin profile.",
      });
    }
  }
);

/* =========================================================
   DASHBOARD
========================================================= */

router.get(
  "/dashboard",
  authenticateAdmin,
  async (req, res) => {
    try {
      const [
        [memberResult],
        [projectResult],
        [eventResult],
        [galleryResult],
      ] = await Promise.all([
        pool.execute(`
          SELECT COUNT(*) AS total
          FROM members
          WHERE is_active = TRUE
        `),

        pool.execute(`
          SELECT COUNT(*) AS total
          FROM projects
          WHERE is_published = TRUE
        `),

        pool.execute(`
          SELECT COUNT(*) AS total
          FROM events
          WHERE is_published = TRUE
        `),

        pool.execute(`
          SELECT COUNT(*) AS total
          FROM gallery
          WHERE is_published = TRUE
        `),
      ]);

      return res.json({
        success: true,
        statistics: {
          members: Number(memberResult[0].total),
          projects: Number(projectResult[0].total),
          events: Number(eventResult[0].total),
          gallery: Number(galleryResult[0].total),
        },
      });
    } catch (error) {
      console.error("DASHBOARD STATISTICS ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to load dashboard statistics.",
      });
    }
  }
);

/* =========================================================
   AUTH TEST
========================================================= */

router.get(
  "/test",
  authenticateAdmin,
  (req, res) => {
    return res.json({
      success: true,
      message: "Admin authentication is working.",
      admin: req.admin,
    });
  }
);

/* =========================================================
   LOGOUT
========================================================= */

router.post(
  "/logout",
  authenticateAdmin,
  async (req, res) => {
    await logActivity({
      adminId: req.admin.id,
      action: "ADMIN_LOGOUT",
      entityType: "admin",
      entityId: req.admin.id,
      description: "Administrator logged out.",
      req,
    });

    return res.json({
      success: true,
      message:
        "Logout successful. Remove the JWT token from the client.",
    });
  }
);

/* =========================================================
   WEBSITE CONTENT ACCESS CHECK

   Normal admin clicking Website Content consumes
   one security attempt.

   Super Admin is always allowed.
========================================================= */

router.post(
  "/security/content-access",
  authenticateAdmin,
  async (req, res) => {
    try {
      if (req.admin.role === "super_admin") {
        return res.json({
          success: true,
          allowed: true,
          superAdmin: true,
          attempts_remaining: 3,
        });
      }

      const result = await recordSecurityViolation(
        req,
        req.admin.id,
        "Unauthorized attempt to access Website Content."
      );

      if (result.locked) {
        return res.status(423).json({
          success: false,
          allowed: false,
          locked: true,
          attempts_remaining: 0,
          message:
            "You have been blocked by the system. Your IP address has been marked as terminated. Please contact the Super Admin.",
        });
      }

      return res.status(403).json({
        success: false,
        allowed: false,
        locked: false,
        attempts_remaining: result.remaining,
        message:
          "Website Content is restricted to the Super Administrator.",
      });
    } catch (error) {
      console.error(
        "CONTENT ACCESS SECURITY ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to process security request.",
      });
    }
  }
);

/* =========================================================
   ADMIN ACCOUNTS
========================================================= */

router.get(
  "/accounts",
  authenticateAdmin,
  requireSuperAdmin,
  async (req, res) => {
    try {
      const [admins] = await pool.execute(`
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
        ORDER BY created_at ASC
      `);

      return res.json({
        success: true,
        admins,
      });
    } catch (error) {
      console.error("GET ADMIN ACCOUNTS ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to load admin accounts.",
      });
    }
  }
);

/* =========================================================
   CREATE ADMIN
========================================================= */

router.post(
  "/accounts",
  authenticateAdmin,
  requireSuperAdmin,
  async (req, res) => {
    try {
      const {
        name,
        username,
        email,
        password,
        role = "admin",
      } = req.body || {};

      if (!name || !username || !password) {
        return res.status(400).json({
          success: false,
          message:
            "Name, username, and password are required.",
        });
      }

      const allowedRoles = [
        "admin",
        "editor",
      ];

      if (!allowedRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          message: "Invalid admin role.",
        });
      }

      if (password.length < 8) {
        return res.status(400).json({
          success: false,
          message:
            "Password must be at least 8 characters long.",
        });
      }

      const cleanName = name.trim();
      const cleanUsername = username.trim();
      const cleanEmail =
        email && email.trim()
          ? email.trim()
          : null;

      const [existingUsername] =
        await pool.execute(
          `
          SELECT id
          FROM admins
          WHERE username = ?
          LIMIT 1
          `,
          [cleanUsername]
        );

      if (existingUsername.length) {
        return res.status(409).json({
          success: false,
          message:
            "That username is already in use.",
        });
      }

      if (cleanEmail) {
        const [existingEmail] =
          await pool.execute(
            `
            SELECT id
            FROM admins
            WHERE email = ?
            LIMIT 1
            `,
            [cleanEmail]
          );

        if (existingEmail.length) {
          return res.status(409).json({
            success: false,
            message:
              "That email is already in use.",
          });
        }
      }

      const passwordHash =
        await bcrypt.hash(password, 12);

      const [result] = await pool.execute(
        `
        INSERT INTO admins
        (
          name,
          username,
          email,
          password_hash,
          role,
          is_active,
          security_attempts_remaining
        )
        VALUES (?, ?, ?, ?, ?, 1, 3)
        `,
        [
          cleanName,
          cleanUsername,
          cleanEmail,
          passwordHash,
          role,
        ]
      );

      await logActivity({
        adminId: req.admin.id,
        action: "ADMIN_CREATED",
        entityType: "admin",
        entityId: result.insertId,
        description:
          `Administrator account "${cleanUsername}" was created.`,
        req,
      });

      const [admins] = await pool.execute(
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
        [result.insertId]
      );

      return res.status(201).json({
        success: true,
        message:
          "Admin account created successfully.",
        admin: admins[0],
      });
    } catch (error) {
      console.error(
        "CREATE ADMIN ACCOUNT ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to create admin account.",
      });
    }
  }
);

/* =========================================================
   UPDATE ADMIN
========================================================= */

router.put(
  "/accounts/:id",
  authenticateAdmin,
  requireSuperAdmin,
  async (req, res) => {
    try {
      const adminId = Number(req.params.id);

      if (
        !Number.isInteger(adminId) ||
        adminId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid admin account ID.",
        });
      }

      if (adminId === req.admin.id) {
        return res.status(400).json({
          success: false,
          message:
            "You cannot modify your own Super Administrator account here.",
        });
      }

      const {
        name,
        username,
        email,
        role,
        is_active,
      } = req.body || {};

      const [existing] =
        await pool.execute(
          `
          SELECT
            id,
            role,
            is_active
          FROM admins
          WHERE id = ?
          LIMIT 1
          `,
          [adminId]
        );

      if (!existing.length) {
        return res.status(404).json({
          success: false,
          message:
            "Admin account not found.",
        });
      }

      const allowedRoles = [
        "admin",
        "editor",
      ];

      if (
        role !== undefined &&
        !allowedRoles.includes(role)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid admin role.",
        });
      }

      const cleanName =
        name !== undefined
          ? name.trim()
          : null;

      const cleanUsername =
        username !== undefined
          ? username.trim()
          : null;

      const cleanEmail =
        email !== undefined
          ? email && email.trim()
            ? email.trim()
            : null
          : null;

      if (
        name !== undefined &&
        !cleanName
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Name cannot be empty.",
        });
      }

      if (
        username !== undefined &&
        !cleanUsername
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Username cannot be empty.",
        });
      }

      if (username !== undefined) {
        const [duplicate] =
          await pool.execute(
            `
            SELECT id
            FROM admins
            WHERE username = ?
              AND id != ?
            LIMIT 1
            `,
            [
              cleanUsername,
              adminId,
            ]
          );

        if (duplicate.length) {
          return res.status(409).json({
            success: false,
            message:
              "That username is already in use.",
          });
        }
      }

      if (
        email !== undefined &&
        cleanEmail
      ) {
        const [duplicate] =
          await pool.execute(
            `
            SELECT id
            FROM admins
            WHERE email = ?
              AND id != ?
            LIMIT 1
            `,
            [
              cleanEmail,
              adminId,
            ]
          );

        if (duplicate.length) {
          return res.status(409).json({
            success: false,
            message:
              "That email is already in use.",
          });
        }
      }

      await pool.execute(
        `
        UPDATE admins
        SET
          name = COALESCE(?, name),
          username = COALESCE(?, username),
          email = CASE
            WHEN ? = 1 THEN ?
            ELSE email
          END,
          role = COALESCE(?, role),
          is_active = COALESCE(?, is_active)
        WHERE id = ?
        `,
        [
          cleanName,
          cleanUsername,
          email !== undefined ? 1 : 0,
          cleanEmail,
          role !== undefined ? role : null,
          is_active !== undefined
            ? Boolean(is_active)
            : null,
          adminId,
        ]
      );

      await logActivity({
        adminId: req.admin.id,
        action: "ADMIN_UPDATED",
        entityType: "admin",
        entityId: adminId,
        description:
          `Administrator account ID ${adminId} was updated.`,
        req,
      });

      const [admins] =
        await pool.execute(
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
          [adminId]
        );

      return res.json({
        success: true,
        message:
          "Admin account updated successfully.",
        admin: admins[0],
      });
    } catch (error) {
      console.error(
        "UPDATE ADMIN ACCOUNT ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to update admin account.",
      });
    }
  }
);

/* =========================================================
   RESET PASSWORD
========================================================= */

router.put(
  "/accounts/:id/password",
  authenticateAdmin,
  requireSuperAdmin,
  async (req, res) => {
    try {
      const adminId = Number(req.params.id);
      const { password } = req.body || {};

      if (
        !Number.isInteger(adminId) ||
        adminId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid admin account ID.",
        });
      }

      if (!password) {
        return res.status(400).json({
          success: false,
          message:
            "New password is required.",
        });
      }

      if (password.length < 8) {
        return res.status(400).json({
          success: false,
          message:
            "Password must be at least 8 characters long.",
        });
      }

      const [existing] =
        await pool.execute(
          `
          SELECT id
          FROM admins
          WHERE id = ?
          LIMIT 1
          `,
          [adminId]
        );

      if (!existing.length) {
        return res.status(404).json({
          success: false,
          message:
            "Admin account not found.",
        });
      }

      const passwordHash =
        await bcrypt.hash(password, 12);

      await pool.execute(
        `
        UPDATE admins
        SET password_hash = ?
        WHERE id = ?
        `,
        [
          passwordHash,
          adminId,
        ]
      );

      await logActivity({
        adminId: req.admin.id,
        action:
          "ADMIN_PASSWORD_RESET",
        entityType: "admin",
        entityId: adminId,
        description:
          `Password reset performed for administrator account ID ${adminId}.`,
        req,
      });

      return res.json({
        success: true,
        message:
          "Admin password updated successfully.",
      });
    } catch (error) {
      console.error(
        "RESET ADMIN PASSWORD ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to reset admin password.",
      });
    }
  }
);

/* =========================================================
   DELETE ADMIN
========================================================= */

router.delete(
  "/accounts/:id",
  authenticateAdmin,
  requireSuperAdmin,
  async (req, res) => {
    try {
      const adminId = Number(req.params.id);

      if (
        !Number.isInteger(adminId) ||
        adminId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid admin account ID.",
        });
      }

      if (adminId === req.admin.id) {
        return res.status(400).json({
          success: false,
          message:
            "You cannot delete your own admin account.",
        });
      }

      const [existing] =
        await pool.execute(
          `
          SELECT
            id,
            role,
            is_active
          FROM admins
          WHERE id = ?
          LIMIT 1
          `,
          [adminId]
        );

      if (!existing.length) {
        return res.status(404).json({
          success: false,
          message:
            "Admin account not found.",
        });
      }

      if (
        existing[0].role === "super_admin"
      ) {
        const [superAdmins] =
          await pool.execute(
            `
            SELECT COUNT(*) AS total
            FROM admins
            WHERE role = 'super_admin'
              AND is_active = 1
            `
          );

        if (
          Number(superAdmins[0].total) <= 1
        ) {
          return res.status(400).json({
            success: false,
            message:
              "The last active super administrator cannot be deleted.",
          });
        }
      }

      await pool.execute(
        `
        DELETE FROM admins
        WHERE id = ?
        `,
        [adminId]
      );

      await logActivity({
        adminId: req.admin.id,
        action: "ADMIN_DELETED",
        entityType: "admin",
        entityId: adminId,
        description:
          `Administrator account ID ${adminId} was deleted.`,
        req,
      });

      return res.json({
        success: true,
        message:
          "Admin account deleted successfully.",
      });
    } catch (error) {
      console.error(
        "DELETE ADMIN ACCOUNT ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to delete admin account.",
      });
    }
  }
);

/* =========================================================
   ACTIVITY LOGS
========================================================= */

router.get(
  "/activity-logs",
  authenticateAdmin,
  requireSuperAdmin,
  async (req, res) => {
    try {
      const [logs] =
        await pool.execute(
          `
          SELECT
            activity_logs.id,
            activity_logs.admin_id,
            admins.name AS admin_name,
            admins.username AS admin_username,
            admins.role AS admin_role,
            activity_logs.action,
            activity_logs.entity_type,
            activity_logs.entity_id,
            activity_logs.description,
            activity_logs.ip_address,
            activity_logs.user_agent,
            activity_logs.created_at
          FROM activity_logs
          LEFT JOIN admins
            ON admins.id = activity_logs.admin_id
          ORDER BY activity_logs.created_at DESC
          LIMIT 500
          `
        );

      return res.json({
        success: true,
        logs,
      });
    } catch (error) {
      console.error(
        "GET ACTIVITY LOGS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load activity logs.",
      });
    }
  }
);

module.exports = router;