
const express = require("express");
const { pool } = require("../db");
const { verifyAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

// GET /api/admin/payments
// Protected payment transaction listing.
router.get("/", verifyAdmin, async (req, res) => {
  try {
    const page = Math.max(
      1,
      Number.parseInt(req.query.page, 10) || 1
    );

    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 20)
    );

    const offset = (page - 1) * limit;

    const search =
      typeof req.query.search === "string"
        ? req.query.search.trim().slice(0, 150)
        : "";

    const status =
      typeof req.query.status === "string"
        ? req.query.status
        : "";

    const allowedStatuses = [
      "created",
      "pending",
      "paid",
      "failed",
      "refunded",
    ];

    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment status.",
      });
    }

    const conditions = [];
    const params = [];

    if (search) {
      conditions.push(`(
        p.gateway_order_id LIKE ?
        OR p.gateway_payment_id LIKE ?
        OR a.application_number LIKE ?
        OR a.applicant_name LIKE ?
        OR a.applicant_email LIKE ?
      )`);

      const term = `%${search}%`;

      params.push(term, term, term, term, term);
    }

    if (status) {
      conditions.push("p.status = ?");
      params.push(status);
    }

    const where = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    const [countRows] = await pool.execute(
      `SELECT COUNT(*) AS total
       FROM payments p
       INNER JOIN applications a
         ON a.id = p.application_id
       ${where}`,
      params
    );

    const [payments] = await pool.execute(
      `SELECT
         p.id,
         p.application_id,
         p.gateway,
         p.gateway_order_id,
         p.gateway_payment_id,
         p.amount,
         p.currency,
         p.status,
         p.created_at,
         p.updated_at,
         a.application_number,
         a.applicant_name,
         a.applicant_email,
         a.applicant_phone
       FROM payments p
       INNER JOIN applications a
         ON a.id = p.application_id
       ${where}
       ORDER BY p.created_at DESC, p.id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return res.json({
      success: true,
      payments,
      pagination: {
        page,
        limit,
        total: Number(countRows[0].total),
        totalPages: Math.ceil(
          Number(countRows[0].total) / limit
        ),
      },
    });
  } catch (error) {
    console.error("Admin payments error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to load payment records.",
    });
  }
});

// GET /api/admin/payments/:id
// Protected individual transaction details.
router.get("/:id", verifyAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment ID.",
      });
    }

    const [rows] = await pool.execute(
      `SELECT
         p.*,
         a.application_number,
         a.applicant_name,
         a.applicant_email,
         a.applicant_phone,
         a.status AS application_status,
         a.review_status
       FROM payments p
       INNER JOIN applications a
         ON a.id = p.application_id
       WHERE p.id = ?
       LIMIT 1`,
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: "Payment record not found.",
      });
    }

    return res.json({
      success: true,
      payment: rows[0],
    });
  } catch (error) {
    console.error("Payment details error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to load payment details.",
    });
  }
});

module.exports = router;
