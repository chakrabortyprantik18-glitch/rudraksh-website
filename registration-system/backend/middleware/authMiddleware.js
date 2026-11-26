const jwt = require("jsonwebtoken");
const { pool } = require("../db");

async function verifyAdmin(req, res, next) {
  try {
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const token = authorization.split(" ")[1];

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured.");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const [admins] = await pool.execute(
      `SELECT id, name, email, role, is_active
       FROM registration_admins
       WHERE id = ?
       LIMIT 1`,
      [decoded.id]
    );

    if (!admins.length || !admins[0].is_active) {
      return res.status(401).json({
        success: false,
        message: "Admin account is inactive or unavailable.",
      });
    }

    req.admin = {
      id: admins[0].id,
      name: admins[0].name,
      email: admins[0].email,
      role: admins[0].role,
    };

    next();
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired authentication token.",
      });
    }

    console.error("Authentication error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Authentication service error.",
    });
  }
}

module.exports = { verifyAdmin };
