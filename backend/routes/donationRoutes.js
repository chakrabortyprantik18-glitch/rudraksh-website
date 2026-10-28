const express = require("express");
const crypto = require("crypto");
const Razorpay = require("razorpay");

const { pool } = require("../config/db");
const { authenticateAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

const getRazorpay = () => {
  if (
    !process.env.RAZORPAY_KEY_ID ||
    !process.env.RAZORPAY_KEY_SECRET
  ) {
    return null;
  }

  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

/*
==================================================
CREATE RAZORPAY ORDER
POST /api/donations/create-order
==================================================
*/
router.post("/create-order", async (req, res) => {
  try {
    const razorpay = getRazorpay();

    if (!razorpay) {
      return res.status(503).json({
        success: false,
        message:
          "Razorpay is not configured on the server.",
      });
    }

    const {
      amount,
      currency = "INR",
      donor_name,
      donor_email,
      donor_phone,
      message,
      is_anonymous = false,
    } = req.body;

    const numericAmount = Number(amount);

    if (
      !numericAmount ||
      Number.isNaN(numericAmount) ||
      numericAmount <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid donation amount.",
      });
    }

    if (currency !== "INR") {
      return res.status(400).json({
        success: false,
        message: "Only INR donations are currently supported.",
      });
    }

    const anonymous = Boolean(is_anonymous);

    const order = await razorpay.orders.create({
      amount: Math.round(numericAmount * 100),
      currency: "INR",
      receipt: `rudraksh_${Date.now()}`,
    });

    const [result] = await pool.execute(
      `
        INSERT INTO donations (
          donor_name,
          donor_email,
          donor_phone,
          amount,
          currency,
          razorpay_order_id,
          payment_status,
          message,
          is_anonymous
        )
        VALUES (?, ?, ?, ?, ?, ?, 'created', ?, ?)
      `,
      [
        anonymous ? null : donor_name || null,
        anonymous ? null : donor_email || null,
        anonymous ? null : donor_phone || null,
        numericAmount,
        "INR",
        order.id,
        message || null,
        anonymous ? 1 : 0,
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Donation order created successfully.",
      donationId: result.insertId,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
      },
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error(
      "CREATE DONATION ORDER ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to create donation order.",
    });
  }
});

/*
==================================================
VERIFY RAZORPAY PAYMENT
POST /api/donations/verify-payment
==================================================
*/
router.post("/verify-payment", async (req, res) => {
  try {
    const {
      donationId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (
      !donationId ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment verification data is incomplete.",
      });
    }

    const [rows] = await pool.execute(
      `
        SELECT *
        FROM donations
        WHERE id = ?
        LIMIT 1
      `,
      [donationId]
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: "Donation not found.",
      });
    }

    const donation = rows[0];

    if (
      donation.razorpay_order_id !==
      razorpay_order_id
    ) {
      return res.status(400).json({
        success: false,
        message: "Razorpay order ID does not match.",
      });
    }

    const body =
      `${razorpay_order_id}|${razorpay_payment_id}`;

    const expectedSignature =
      crypto
        .createHmac(
          "sha256",
          process.env.RAZORPAY_KEY_SECRET
        )
        .update(body)
        .digest("hex");

    const expectedBuffer = Buffer.from(
      expectedSignature,
      "utf8"
    );

    const receivedBuffer = Buffer.from(
      razorpay_signature,
      "utf8"
    );

    if (
      expectedBuffer.length !==
      receivedBuffer.length
    ) {
      await pool.execute(
        `
          UPDATE donations
          SET
            payment_status = 'failed',
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `,
        [donationId]
      );

      return res.status(400).json({
        success: false,
        message: "Invalid payment signature.",
      });
    }

    const isValid = crypto.timingSafeEqual(
      expectedBuffer,
      receivedBuffer
    );

    if (!isValid) {
      await pool.execute(
        `
          UPDATE donations
          SET
            payment_status = 'failed',
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `,
        [donationId]
      );

      return res.status(400).json({
        success: false,
        message: "Invalid payment signature.",
      });
    }

    await pool.execute(
      `
        UPDATE donations
        SET
          razorpay_payment_id = ?,
          razorpay_signature = ?,
          payment_status = 'paid',
          paid_at = NOW(),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      [
        razorpay_payment_id,
        razorpay_signature,
        donationId,
      ]
    );

    return res.json({
      success: true,
      message: "Payment verified successfully.",
      donationId,
      paymentStatus: "paid",
    });
  } catch (error) {
    console.error(
      "VERIFY DONATION PAYMENT ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to verify payment.",
    });
  }
});

/*
==================================================
ADMIN — LIST DONATIONS
GET /api/donations/admin
==================================================
IMPORTANT:
This MUST come before /:id
==================================================
*/
router.get(
  "/admin",
  authenticateAdmin,
  async (req, res) => {
    try {
      const [rows] = await pool.execute(
        `
          SELECT
            id,
            donor_name,
            donor_email,
            donor_phone,
            amount,
            currency,
            razorpay_order_id,
            razorpay_payment_id,
            payment_status,
            payment_method,
            message,
            is_anonymous,
            paid_at,
            created_at,
            updated_at
          FROM donations
          ORDER BY created_at DESC
        `
      );

      return res.json({
        success: true,
        donations: rows,
      });
    } catch (error) {
      console.error(
        "GET ADMIN DONATIONS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Unable to fetch donations.",
      });
    }
  }
);

/*
==================================================
ADMIN — GET SINGLE DONATION
GET /api/donations/admin/:id
==================================================
*/
router.get(
  "/admin/:id",
  authenticateAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;

      const [rows] = await pool.execute(
        `
          SELECT *
          FROM donations
          WHERE id = ?
          LIMIT 1
        `,
        [id]
      );

      if (!rows.length) {
        return res.status(404).json({
          success: false,
          message: "Donation not found.",
        });
      }

      return res.json({
        success: true,
        donation: rows[0],
      });
    } catch (error) {
      console.error(
        "GET ADMIN DONATION ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Unable to fetch donation.",
      });
    }
  }
);

/*
==================================================
PUBLIC — GET DONATION STATUS
GET /api/donations/:id
==================================================
IMPORTANT:
This MUST remain AFTER /admin routes.
==================================================
*/
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.execute(
      `
        SELECT
          id,
          amount,
          currency,
          payment_status,
          razorpay_order_id,
          razorpay_payment_id,
          paid_at,
          created_at
        FROM donations
        WHERE id = ?
        LIMIT 1
      `,
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: "Donation not found.",
      });
    }

    return res.json({
      success: true,
      donation: rows[0],
    });
  } catch (error) {
    console.error(
      "GET DONATION STATUS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to fetch donation status.",
    });
  }
});

module.exports = router;