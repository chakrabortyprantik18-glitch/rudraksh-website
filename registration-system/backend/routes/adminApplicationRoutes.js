
const express = require("express");
const { pool } = require("../db");
const { verifyAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

// All routes require an authenticated admin.

// GET /api/admin/applications
// Search, filter and paginate applications.
router.get("/", verifyAdmin, async (req, res) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
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
      typeof req.query.status === "string" ? req.query.status : "";

    const reviewStatus =
      typeof req.query.reviewStatus === "string"
        ? req.query.reviewStatus
        : "";

    const allowedStatuses = [
      "submitted",
      "pending_payment",
      "confirmed",
      "rejected",
    ];

    const allowedReviewStatuses = [
      "pending",
      "approved",
      "rejected",
    ];

    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid application status.",
      });
    }

    if (
      reviewStatus &&
      !allowedReviewStatuses.includes(reviewStatus)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid review status.",
      });
    }

    const conditions = [];
    const params = [];

    if (search) {
      conditions.push(`(
        a.application_number LIKE ?
        OR a.applicant_name LIKE ?
        OR a.applicant_email LIKE ?
        OR a.applicant_phone LIKE ?
      )`);

      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    if (status) {
      conditions.push("a.status = ?");
      params.push(status);
    }

    if (reviewStatus) {
      conditions.push("a.review_status = ?");
      params.push(reviewStatus);
    }

    const where = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    const [countRows] = await pool.execute(
      `SELECT COUNT(*) AS total
       FROM applications a
       ${where}`,
      params
    );

    const [applications] = await pool.execute(
      `SELECT
         a.id,
         a.form_id,
         a.application_number,
         a.applicant_name,
         a.applicant_email,
         a.applicant_phone,
         a.application_data,
         a.status,
         a.review_status,
         a.reviewed_by,
         a.reviewed_at,
         a.rejection_reason,
         a.submitted_at,
         p.status AS payment_status,
         p.amount AS payment_amount,
         p.currency AS payment_currency
       FROM applications a
       LEFT JOIN (
         SELECT p1.*
         FROM payments p1
         INNER JOIN (
           SELECT application_id, MAX(id) AS latest_id
           FROM payments
           GROUP BY application_id
         ) latest ON latest.latest_id = p1.id
       ) p ON p.application_id = a.id
       ${where}
       ORDER BY a.submitted_at DESC, a.id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const results = applications.map((application) => {
      let applicationData = {};

      try {
        applicationData =
          typeof application.application_data === "string"
            ? JSON.parse(application.application_data)
            : application.application_data || {};
      } catch {
        applicationData = {};
      }

      delete application.application_data;

      return {
        ...application,
        participant: applicationData.participant || {},
        performance: applicationData.performance || {},
      };
    });

    return res.json({
      success: true,
      applications: results,
      pagination: {
        page,
        limit,
        total: Number(countRows[0].total),
        totalPages: Math.ceil(Number(countRows[0].total) / limit),
      },
    });
  } catch (error) {
    console.error("Admin applications error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to load applications.",
    });
  }
});

// GET /api/admin/applications/:id
// View one complete application.
router.get("/:id", verifyAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid application ID.",
      });
    }

    const [rows] = await pool.execute(
      `SELECT
         a.id,
         a.form_id,
         a.application_number,
         a.applicant_name,
         a.applicant_email,
         a.applicant_phone,
         a.application_data,
         a.status,
         a.review_status,
         a.reviewed_by,
         a.reviewed_at,
         a.rejection_reason,
         a.submitted_at,
         p.gateway,
         p.gateway_order_id,
         p.gateway_payment_id,
         p.amount,
         p.currency,
         p.status AS payment_status,
         p.created_at AS payment_created_at
       FROM applications a
       LEFT JOIN (
         SELECT p1.*
         FROM payments p1
         INNER JOIN (
           SELECT application_id, MAX(id) AS latest_id
           FROM payments
           GROUP BY application_id
         ) latest ON latest.latest_id = p1.id
       ) p ON p.application_id = a.id
       WHERE a.id = ?
       LIMIT 1`,
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: "Application not found.",
      });
    }

    const application = rows[0];

    let applicationData = {};

    try {
      applicationData =
        typeof application.application_data === "string"
          ? JSON.parse(application.application_data)
          : application.application_data || {};
    } catch {
      applicationData = {};
    }

    delete application.application_data;

    return res.json({
      success: true,
      application: {
        ...application,
        participant: applicationData.participant || {},
        performance: applicationData.performance || {},
      },
    });
  } catch (error) {
    console.error("Application details error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to load application details.",
    });
  }
});

// PATCH /api/admin/applications/:id/review
// Approve or reject an application.
// Only applications with a verified paid payment can be reviewed.
router.patch("/:id/review", verifyAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const { action, reason } = req.body || {};

  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid application ID.",
    });
  }

  if (!["approved", "rejected"].includes(action)) {
    return res.status(400).json({
      success: false,
      message: "Action must be approved or rejected.",
    });
  }

  if (
    action === "rejected" &&
    (typeof reason !== "string" || !reason.trim())
  ) {
    return res.status(400).json({
      success: false,
      message: "A rejection reason is required.",
    });
  }

  const cleanReason =
    action === "rejected" ? reason.trim().slice(0, 2000) : null;

  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [applications] = await connection.execute(
      `SELECT id, status, review_status
       FROM applications
       WHERE id = ?
       LIMIT 1
       FOR UPDATE`,
      [id]
    );

    if (!applications.length) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Application not found.",
      });
    }

    const application = applications[0];

    if (application.status !== "confirmed") {
      await connection.rollback();

      return res.status(409).json({
        success: false,
        message: "Application must have a confirmed payment before review.",
      });
    }

    if (application.review_status !== "pending") {
      await connection.rollback();

      return res.status(409).json({
        success: false,
        message: "This application has already been reviewed.",
      });
    }

    const [paidPayments] = await connection.execute(
      `SELECT id
       FROM payments
       WHERE application_id = ?
         AND gateway = 'razorpay'
         AND status = 'paid'
         AND gateway_payment_id IS NOT NULL
       LIMIT 1
       FOR UPDATE`,
      [id]
    );

    if (!paidPayments.length) {
      await connection.rollback();

      return res.status(409).json({
        success: false,
        message: "No verified Razorpay payment was found.",
      });
    }

    await connection.execute(
      `UPDATE applications
       SET review_status = ?,
           reviewed_by = ?,
           reviewed_at = NOW(),
           rejection_reason = ?
       WHERE id = ?`,
      [action, req.admin.id, cleanReason, id]
    );

    await connection.execute(
      `INSERT INTO application_review_logs
       (application_id, admin_id, action, reason)
       VALUES (?, ?, ?, ?)`,
      [id, req.admin.id, action, cleanReason]
    );

    await connection.commit();

    return res.json({
      success: true,
      message:
        action === "approved"
          ? "Application approved successfully."
          : "Application rejected successfully.",
      applicationId: id,
      reviewStatus: action,
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    console.error("Application review error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to review application.",
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

module.exports = router;
