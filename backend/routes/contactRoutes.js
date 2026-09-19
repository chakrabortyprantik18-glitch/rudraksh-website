const express = require("express");

const router = express.Router();

const { pool } = require("../config/db");
const { authenticateAdmin } = require("../middleware/authMiddleware");

// ============================================================
// CONTACT MESSAGES API
// ============================================================

const allowedStatuses = [
  "unread",
  "read",
  "replied",
  "archived",
];

// ============================================================
// PUBLIC — SUBMIT CONTACT MESSAGE
// POST /api/contact
// ============================================================

router.post("/", async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      subject,
      message,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name is required.",
      });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message is required.",
      });
    }

    if (name.trim().length > 150) {
      return res.status(400).json({
        success: false,
        message: "Name is too long.",
      });
    }

    if (email && email.trim().length > 255) {
      return res.status(400).json({
        success: false,
        message: "Email is too long.",
      });
    }

    if (phone && phone.trim().length > 30) {
      return res.status(400).json({
        success: false,
        message: "Phone number is too long.",
      });
    }

    if (subject && subject.trim().length > 255) {
      return res.status(400).json({
        success: false,
        message: "Subject is too long.",
      });
    }

    if (email && email.trim()) {
      const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailPattern.test(email.trim())) {
        return res.status(400).json({
          success: false,
          message:
            "Please provide a valid email address.",
        });
      }
    }

    const [result] = await pool.execute(
      `
      INSERT INTO contact_messages
      (
        name,
        email,
        phone,
        subject,
        message,
        status
      )
      VALUES (?, ?, ?, ?, ?, 'unread')
      `,
      [
        name.trim(),
        email && email.trim()
          ? email.trim()
          : null,
        phone && phone.trim()
          ? phone.trim()
          : null,
        subject && subject.trim()
          ? subject.trim()
          : null,
        message.trim(),
      ]
    );

    return res.status(201).json({
      success: true,
      message:
        "Your message has been sent successfully.",
      messageId: result.insertId,
    });
  } catch (error) {
    console.error(
      "SUBMIT CONTACT MESSAGE ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to send your message right now.",
    });
  }
});

// ============================================================
// ADMIN — GET ALL CONTACT MESSAGES
// GET /api/contact
// ============================================================

router.get(
  "/",
  authenticateAdmin,
  async (req, res) => {
    try {
      const [messages] = await pool.execute(
        `
        SELECT
          id,
          name,
          email,
          phone,
          subject,
          message,
          status,
          replied_at,
          created_at,
          updated_at
        FROM contact_messages
        ORDER BY
          CASE
            WHEN status = 'unread' THEN 0
            WHEN status = 'read' THEN 1
            WHEN status = 'replied' THEN 2
            WHEN status = 'archived' THEN 3
            ELSE 4
          END,
          created_at DESC
        `
      );

      return res.json({
        success: true,
        messages,
      });
    } catch (error) {
      console.error(
        "GET CONTACT MESSAGES ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to fetch contact messages.",
      });
    }
  }
);

// ============================================================
// ADMIN — GET SINGLE CONTACT MESSAGE
// GET /api/contact/:id
// ============================================================

router.get(
  "/:id",
  authenticateAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!/^\d+$/.test(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid message ID.",
        });
      }

      const [messages] = await pool.execute(
        `
        SELECT
          id,
          name,
          email,
          phone,
          subject,
          message,
          status,
          replied_at,
          created_at,
          updated_at
        FROM contact_messages
        WHERE id = ?
        LIMIT 1
        `,
        [id]
      );

      if (messages.length === 0) {
        return res.status(404).json({
          success: false,
          message:
            "Contact message not found.",
        });
      }

      return res.json({
        success: true,
        message: messages[0],
      });
    } catch (error) {
      console.error(
        "GET SINGLE CONTACT ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to fetch contact message.",
      });
    }
  }
);

// ============================================================
// ADMIN — UPDATE CONTACT MESSAGE
// PUT /api/contact/:id
// ============================================================

router.put(
  "/:id",
  authenticateAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!/^\d+$/.test(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid message ID.",
        });
      }

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid message status.",
        });
      }

      const [existing] = await pool.execute(
        `
        SELECT id
        FROM contact_messages
        WHERE id = ?
        LIMIT 1
        `,
        [id]
      );

      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          message:
            "Contact message not found.",
        });
      }

      let repliedAt = null;

      if (status === "replied") {
        repliedAt = new Date();
      }

      await pool.execute(
        `
        UPDATE contact_messages
        SET
          status = ?,
          replied_at = ?
        WHERE id = ?
        `,
        [
          status,
          repliedAt,
          id,
        ]
      );

      return res.json({
        success: true,
        message:
          "Contact message updated successfully.",
      });
    } catch (error) {
      console.error(
        "UPDATE CONTACT ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to update contact message.",
      });
    }
  }
);

// ============================================================
// ADMIN — DELETE CONTACT MESSAGE
// DELETE /api/contact/:id
// ============================================================

router.delete(
  "/:id",
  authenticateAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!/^\d+$/.test(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid message ID.",
        });
      }

      const [result] = await pool.execute(
        `
        DELETE FROM contact_messages
        WHERE id = ?
        `,
        [id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message:
            "Contact message not found.",
        });
      }

      return res.json({
        success: true,
        message:
          "Contact message deleted successfully.",
      });
    } catch (error) {
      console.error(
        "DELETE CONTACT ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to delete contact message.",
      });
    }
  }
);

// ============================================================
// EXPORT
// ============================================================

module.exports = router;