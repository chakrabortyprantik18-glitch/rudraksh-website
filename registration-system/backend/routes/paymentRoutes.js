const express = require("express");
const crypto = require("crypto");
const { pool } = require("../db");
const razorpay = require("../config/razorpay");
const {
  createPassToken,
  hashPassToken,
} = require("../utils/passToken");
const { generatePassPdf } = require("../utils/passGenerator");
const { sendUtsavConfirmationEmail } = require("../utils/emailService");

const router = express.Router();

// ========================================
// HELPERS
// ========================================

function safeCompare(expected, received) {
  if (
    typeof expected !== "string" ||
    typeof received !== "string" ||
    !/^[a-f0-9]{64}$/i.test(expected) ||
    !/^[a-f0-9]{64}$/i.test(received)
  ) {
    return false;
  }

  const expectedBuffer = Buffer.from(expected, "hex");
  const receivedBuffer = Buffer.from(received, "hex");

  return (
    expectedBuffer.length === receivedBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
  );
}

function getPublicApiUrl() {
  const apiUrl = process.env.PUBLIC_API_URL;

  if (!apiUrl) {
    throw new Error("PUBLIC_API_URL is not configured.");
  }

  return apiUrl.replace(/\/+$/, "");
}

function getVerificationUrl(token) {
  return `${getPublicApiUrl()}/api/applications/verify/${token}`;
}

function parseApplicationData(value) {
  try {
    return typeof value === "string"
      ? JSON.parse(value)
      : (value || {});
  } catch {
    return {};
  }
}

// ========================================
// EMAIL CONFIRMATION
// ========================================

// Email errors are logged and recorded,
// but never undo a confirmed payment.

async function sendPaymentConfirmationEmail(applicationId, token) {
  let claimed = false;

  try {
    const [applications] = await pool.execute(
      `SELECT
         application_number,
         applicant_name,
         applicant_email,
         application_data
       FROM applications
       WHERE id = ?
       LIMIT 1`,
      [applicationId]
    );

    if (!applications.length) {
      throw new Error("Application not found for confirmation email.");
    }

    const application = applications[0];

    if (!application.applicant_email) {
      console.log(
        `Confirmation email skipped: application ${applicationId} has no email.`
      );
      return;
    }

    // Claim the one-time notification.
    const [insertResult] = await pool.execute(
      `INSERT IGNORE INTO application_email_notifications
       (application_id, status, attempts)
       VALUES (?, 'sending', 1)`,
      [applicationId]
    );

    claimed = insertResult.affectedRows === 1;

    // Retry failed or stale notifications.
    if (!claimed) {
      const [retryResult] = await pool.execute(
        `UPDATE application_email_notifications
         SET status = 'sending',
             attempts = attempts + 1,
             last_error = NULL
         WHERE application_id = ?
           AND (
             status = 'failed'
             OR (
               status = 'sending'
               AND updated_at < DATE_SUB(NOW(), INTERVAL 10 MINUTE)
             )
           )`,
        [applicationId]
      );

      claimed = retryResult.affectedRows === 1;
    }

    if (!claimed) {
      console.log(
        `Confirmation email already sent or in progress for application ${applicationId}.`
      );
      return;
    }

    const applicationData = parseApplicationData(
      application.application_data
    );

    const performance = applicationData.performance || {};

    const passDownloadUrl =
      `${getPublicApiUrl()}/api/payments/pass/` +
      `${applicationId}/${token}`;

    await sendUtsavConfirmationEmail({
      to: application.applicant_email,
      participantName: application.applicant_name,
      applicationId: application.application_number,
      category: performance.category || "N/A",
      performance: performance.option || "N/A",
      group: performance.group || "",
      passDownloadUrl,
    });

    await pool.execute(
      `UPDATE application_email_notifications
       SET status = 'sent',
           sent_at = NOW(),
           last_error = NULL
       WHERE application_id = ?`,
      [applicationId]
    );

    console.log(
      `Utsav confirmation email sent for ${application.application_number}.`
    );

  } catch (error) {
    console.error("Confirmation email error:", error.message);

    if (claimed) {
      try {
        await pool.execute(
          `UPDATE application_email_notifications
           SET status = 'failed',
               last_error = ?
           WHERE application_id = ?`,
          [
            String(error.message || "Email failed").slice(0, 2000),
            applicationId
          ]
        );
      } catch (databaseError) {
        console.error(
          "Could not update email notification status:",
          databaseError.message
        );
      }
    }
  }
}

// ========================================
// CONFIRM PAYMENT
// ========================================

async function confirmPayment(orderId, paymentId) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [payments] = await connection.execute(
      `SELECT
         id,
         application_id,
         amount,
         currency,
         status,
         gateway_payment_id
       FROM payments
       WHERE gateway_order_id = ?
         AND gateway = 'razorpay'
       LIMIT 1
       FOR UPDATE`,
      [orderId]
    );

    if (!payments.length) {
      await connection.rollback();

      return {
        success: false,
        message: "Payment order not found.",
      };
    }

    const payment = payments[0];

    if (
      payment.gateway_payment_id &&
      payment.gateway_payment_id !== paymentId
    ) {
      await connection.rollback();

      return {
        success: false,
        message: "Payment ID mismatch.",
      };
    }

    const { tokenHash } = createPassToken(payment.application_id);

    // Handle repeated payment confirmations safely.
    if (payment.status === "paid") {
      await connection.execute(
        `UPDATE applications
         SET status = 'confirmed',
             pass_token_hash = COALESCE(pass_token_hash, ?)
         WHERE id = ?`,
        [tokenHash, payment.application_id]
      );

      await connection.commit();

      return {
        success: true,
        alreadyPaid: true,
        applicationId: payment.application_id,
      };
    }

    // Mark payment as paid.
    await connection.execute(
      `UPDATE payments
       SET gateway_payment_id = ?,
           status = 'paid'
       WHERE id = ?`,
      [paymentId, payment.id]
    );

    // Confirm application and save QR-token hash.
    await connection.execute(
      `UPDATE applications
       SET status = 'confirmed',
           pass_token_hash = COALESCE(pass_token_hash, ?)
       WHERE id = ?`,
      [tokenHash, payment.application_id]
    );

    await connection.commit();

    return {
      success: true,
      applicationId: payment.application_id,
    };

  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// ========================================
// CREATE RAZORPAY ORDER
// POST /api/payments/create-order
// ========================================

router.post("/create-order", async (req, res) => {
  try {
    const applicationId = Number(req.body.applicationId);

    if (!Number.isSafeInteger(applicationId) || applicationId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid application ID.",
      });
    }

    const [applications] = await pool.execute(
      `SELECT a.id, a.status, f.fee
       FROM applications a
       INNER JOIN forms f ON f.id = a.form_id
       INNER JOIN events e ON e.id = f.event_id
       WHERE a.id = ?
         AND e.status = 'published'
       LIMIT 1`,
      [applicationId]
    );

    if (!applications.length) {
      return res.status(404).json({
        success: false,
        message: "Application not found.",
      });
    }

    const application = applications[0];

    if (application.status !== "pending_payment") {
      return res.status(400).json({
        success: false,
        message: "This application is not awaiting payment.",
      });
    }

    const amountInRupees = Number(application.fee);

    if (!Number.isFinite(amountInRupees) || amountInRupees <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid registration fee.",
      });
    }

    const amountInPaise = Math.round(amountInRupees * 100);

    if (!Number.isSafeInteger(amountInPaise)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment amount.",
      });
    }

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `RUD${applicationId}-${Date.now()}`.slice(0, 40),
      notes: {
        application_id: String(applicationId),
        purpose: "Utsav 2026 Registration",
      },
    });

    await pool.execute(
      `INSERT INTO payments
       (application_id, gateway, gateway_order_id, amount, currency, status)
       VALUES (?, 'razorpay', ?, ?, 'INR', 'created')`,
      [
        applicationId,
        order.id,
        amountInRupees,
      ]
    );

    return res.status(201).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      applicationId,
    });

  } catch (error) {
    console.error("Create Razorpay order error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to create payment order.",
    });
  }
});

// ========================================
// VERIFY RAZORPAY PAYMENT
// POST /api/payments/verify
// ========================================

router.post("/verify", async (req, res) => {
  try {
    const {
      applicationId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body || {};

    if (
      !Number.isSafeInteger(Number(applicationId)) ||
      Number(applicationId) <= 0 ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment verification details are incomplete.",
      });
    }

    if (!process.env.RAZORPAY_KEY_SECRET) {
      throw new Error("Razorpay key secret is not configured.");
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (!safeCompare(expectedSignature, razorpay_signature)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature.",
      });
    }

    const [payments] = await pool.execute(
      `SELECT p.*, a.status AS application_status
       FROM payments p
       INNER JOIN applications a ON a.id = p.application_id
       WHERE p.gateway_order_id = ?
         AND p.application_id = ?
         AND p.gateway = 'razorpay'
       LIMIT 1`,
      [razorpay_order_id, Number(applicationId)]
    );

    if (!payments.length) {
      return res.status(404).json({
        success: false,
        message: "Matching payment order not found.",
      });
    }

    const paymentRecord = payments[0];

    if (
      paymentRecord.gateway_payment_id &&
      paymentRecord.gateway_payment_id !== razorpay_payment_id
    ) {
      return res.status(409).json({
        success: false,
        message: "This order is linked to a different payment.",
      });
    }

    // Verify payment directly with Razorpay.
    const razorpayPayment = await razorpay.payments.fetch(
      razorpay_payment_id
    );

    if (
      razorpayPayment.order_id !== razorpay_order_id ||
      razorpayPayment.currency !== "INR" ||
      Number(razorpayPayment.amount) !==
        Math.round(Number(paymentRecord.amount) * 100)
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment details do not match the order.",
      });
    }

    // Only captured payments are successful.
    if (razorpayPayment.status !== "captured") {
      return res.status(202).json({
        success: false,
        pending: true,
        message: "Payment is not captured yet. Please wait for confirmation.",
      });
    }

    const result = await confirmPayment(
      razorpay_order_id,
      razorpay_payment_id
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    const { token } = createPassToken(Number(applicationId));

    const verificationUrl = getVerificationUrl(token);

    const passDownloadUrl =
      `${getPublicApiUrl()}/api/payments/pass/` +
      `${Number(applicationId)}/${token}`;

    // Send email after payment confirmation.
    // Email failure does not affect payment status.
    await sendPaymentConfirmationEmail(Number(applicationId), token);

    return res.json({
      success: true,
      message: "Payment verified successfully.",
      applicationId: Number(applicationId),
      alreadyPaid: Boolean(result.alreadyPaid),
      passReady: true,
      verificationUrl,
      passDownloadUrl,
    });

  } catch (error) {
    console.error("Payment verification error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to verify payment. Please contact the organizers.",
    });
  }
});

// ========================================
// DOWNLOAD ENTRY PASS PDF
// GET /api/payments/pass/:applicationId/:token
// ========================================

router.get("/pass/:applicationId/:token", async (req, res) => {
  try {
    const applicationId = Number(req.params.applicationId);
    const tokenHash = hashPassToken(req.params.token);

    if (
      !Number.isSafeInteger(applicationId) ||
      applicationId <= 0 ||
      !tokenHash
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid entry pass request.",
      });
    }

    const [applications] = await pool.execute(
      `SELECT
         a.id,
         a.application_number,
         a.applicant_name,
         a.application_data,
         a.status,
         a.pass_token_hash
       FROM applications a
       WHERE a.id = ?
         AND a.status = 'confirmed'
         AND a.pass_token_hash = ?
         AND EXISTS (
           SELECT 1
           FROM payments p
           WHERE p.application_id = a.id
             AND p.gateway = 'razorpay'
             AND p.status = 'paid'
         )
       LIMIT 1`,
      [applicationId, tokenHash]
    );

    if (!applications.length) {
      return res.status(404).json({
        success: false,
        message: "Confirmed entry pass not found or token is invalid.",
      });
    }

    const application = applications[0];

    const verificationUrl = getVerificationUrl(req.params.token);

    const pdfBuffer = await generatePassPdf(
      application,
      verificationUrl
    );

    const safeApplicationNumber = String(
      application.application_number
    ).replace(/[^a-zA-Z0-9\_-]/g, "");

    res.setHeader("Content-Type", "application/pdf");

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="UTSAV-2026-${safeApplicationNumber}.pdf"`
    );

    res.setHeader("Content-Length", pdfBuffer.length);
    res.setHeader("Cache-Control", "private, no-store");

    return res.send(pdfBuffer);

  } catch (error) {
    console.error("Entry pass PDF error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to generate entry pass PDF.",
    });
  }
});

// ========================================
// RAZORPAY WEBHOOK
// POST /api/payments/webhook
// ========================================

router.post("/webhook", async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers["x-razorpay-signature"];

    if (!webhookSecret || !req.rawBody || !signature) {
      return res.status(400).json({
        success: false,
        message: "Webhook verification data is missing.",
      });
    }

    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(req.rawBody)
      .digest("hex");

    if (!safeCompare(expectedSignature, signature)) {
      return res.status(400).json({
        success: false,
        message: "Invalid webhook signature.",
      });
    }

    const event = req.body;

    if (event.event !== "payment.captured") {
      return res.json({
        success: true,
        message: "Webhook event acknowledged.",
      });
    }

    const payment = event.payload?.payment?.entity;

    if (!payment || !payment.order_id || !payment.id) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment event.",
      });
    }

    const [records] = await pool.execute(
      `SELECT id, amount, currency
       FROM payments
       WHERE gateway_order_id = ?
         AND gateway = 'razorpay'
       LIMIT 1`,
      [payment.order_id]
    );

    if (!records.length) {
      return res.status(404).json({
        success: false,
        message: "Payment order not found.",
      });
    }

    if (
      Number(payment.amount) !==
        Math.round(Number(records[0].amount) * 100) ||
      payment.currency !== records[0].currency
    ) {
      return res.status(400).json({
        success: false,
        message: "Webhook payment amount mismatch.",
      });
    }

    const result = await confirmPayment(
      payment.order_id,
      payment.id
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    const { token } = createPassToken(Number(result.applicationId));

    // Send confirmation email through the same notification system.
    await sendPaymentConfirmationEmail(
      Number(result.applicationId),
      token
    );

    return res.json({
      success: true,
      message: "Payment webhook processed.",
    });

  } catch (error) {
    console.error("Razorpay webhook error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Webhook processing failed.",
    });
  }
});

module.exports = router;