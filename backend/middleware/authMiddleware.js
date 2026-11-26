const jwt = require("jsonwebtoken");
const { pool } = require("../config/db");

async function authenticateAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (
      !authHeader ||
      !authHeader.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token.",
      });
    }

    // =====================================================
    // VERIFY JWT
    // =====================================================

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const adminId =
      decoded.id ||
      decoded.adminId ||
      decoded.userId;

    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: "Invalid administrator identity.",
      });
    }

    // =====================================================
    // CHECK LIVE ADMIN ACCOUNT FROM DATABASE
    // =====================================================

    const [rows] = await pool.execute(
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
          lock_reason
        FROM admins
        WHERE id = ?
        LIMIT 1
      `,
      [adminId]
    );

    if (!rows.length) {
      return res.status(401).json({
        success: false,
        message: "Administrator account not found.",
      });
    }

    const admin = rows[0];

    // =====================================================
    // CHECK MANUAL BLOCK / DEACTIVATION
    // =====================================================

    if (!admin.is_active) {
      return res.status(403).json({
        success: false,
        code: "ADMIN_BLOCKED",
        message:
          "Your administrator account has been blocked. Please contact the Super Admin.",
      });
    }

    // =====================================================
    // CHECK SECURITY LOCK
    // =====================================================

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
          locked: true,
          locked_at: admin.locked_at,
          locked_ip: admin.locked_ip,
          lock_reason: admin.lock_reason,
          attempts_remaining:
            Number(
              admin.security_attempts_remaining
            ),
        },
      });
    }

    // =====================================================
    // ATTACH LIVE ADMIN DATA TO REQUEST
    // =====================================================

    req.admin = {
      ...decoded,

      id: admin.id,
      adminId: admin.id,

      name: admin.name,
      username: admin.username,
      email: admin.email,
      role: admin.role,

      is_active: admin.is_active,

      security_attempts_remaining:
        Number(
          admin.security_attempts_remaining
        ),

      locked_at: admin.locked_at,
      locked_ip: admin.locked_ip,
      lock_reason: admin.lock_reason,
    };

    next();
  } catch (error) {
    console.error(
      "AUTH ERROR:",
      error.message
    );

    // =====================================================
    // JWT ERRORS
    // =====================================================

    if (
      error.name === "TokenExpiredError"
    ) {
      return res.status(401).json({
        success: false,
        code: "TOKEN_EXPIRED",
        message:
          "Your session has expired. Please log in again.",
      });
    }

    if (
      error.name === "JsonWebTokenError"
    ) {
      return res.status(401).json({
        success: false,
        code: "INVALID_TOKEN",
        message:
          "Invalid authentication token.",
      });
    }

    // =====================================================
    // DATABASE / SERVER ERROR
    // =====================================================

    return res.status(500).json({
      success: false,
      message:
        "Unable to verify administrator account.",
    });
  }
}

module.exports = {
  authenticateAdmin,
};