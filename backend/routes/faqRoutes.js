const express = require("express");

const router = express.Router();

const { pool } = require("../config/db");
const { authenticateAdmin } = require("../middleware/authMiddleware");

// ============================================================
// FAQ API
// ============================================================

// ============================================================
// PUBLIC — GET PUBLISHED FAQs
// GET /api/faqs
// ============================================================

router.get("/", async (req, res) => {
  try {
    const [faqs] = await pool.execute(
      `
      SELECT
        id,
        question,
        answer,
        display_order,
        is_published,
        created_at,
        updated_at
      FROM faqs
      WHERE is_published = 1
      ORDER BY display_order ASC, id ASC
      `
    );

    return res.json({
      success: true,
      faqs,
    });
  } catch (error) {
    console.error(
      "GET PUBLIC FAQ ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to load FAQs.",
    });
  }
});

// ============================================================
// ADMIN — GET ALL FAQs
// GET /api/faqs/admin
// ============================================================

router.get(
  "/admin",
  authenticateAdmin,
  async (req, res) => {
    try {
      const [faqs] = await pool.execute(
        `
        SELECT
          id,
          question,
          answer,
          display_order,
          is_published,
          created_at,
          updated_at
        FROM faqs
        ORDER BY display_order ASC, id ASC
        `
      );

      return res.json({
        success: true,
        faqs,
      });
    } catch (error) {
      console.error(
        "GET ADMIN FAQ ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load admin FAQs.",
      });
    }
  }
);

// ============================================================
// ADMIN — GET SINGLE FAQ
// GET /api/faqs/:id
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
          message: "Invalid FAQ ID.",
        });
      }

      const [faqs] = await pool.execute(
        `
        SELECT
          id,
          question,
          answer,
          display_order,
          is_published,
          created_at,
          updated_at
        FROM faqs
        WHERE id = ?
        LIMIT 1
        `,
        [id]
      );

      if (faqs.length === 0) {
        return res.status(404).json({
          success: false,
          message: "FAQ not found.",
        });
      }

      return res.json({
        success: true,
        faq: faqs[0],
      });
    } catch (error) {
      console.error(
        "GET SINGLE FAQ ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Unable to load FAQ.",
      });
    }
  }
);

// ============================================================
// ADMIN — CREATE FAQ
// POST /api/faqs
// ============================================================

router.post(
  "/",
  authenticateAdmin,
  async (req, res) => {
    try {
      const {
        question,
        answer,
        display_order,
        is_published,
      } = req.body;

      if (
        !question ||
        !question.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Question is required.",
        });
      }

      if (
        !answer ||
        !answer.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Answer is required.",
        });
      }

      if (question.trim().length > 500) {
        return res.status(400).json({
          success: false,
          message:
            "Question cannot exceed 500 characters.",
        });
      }

      const order = Number.isInteger(
        Number(display_order)
      )
        ? Number(display_order)
        : 0;

      const published =
        is_published === false ||
        is_published === 0
          ? 0
          : 1;

      const [result] =
        await pool.execute(
          `
          INSERT INTO faqs
          (
            question,
            answer,
            display_order,
            is_published
          )
          VALUES (?, ?, ?, ?)
          `,
          [
            question.trim(),
            answer.trim(),
            order,
            published,
          ]
        );

      return res.status(201).json({
        success: true,
        message:
          "FAQ created successfully.",
        faqId: result.insertId,
      });
    } catch (error) {
      console.error(
        "CREATE FAQ ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to create FAQ.",
      });
    }
  }
);

// ============================================================
// ADMIN — UPDATE FAQ
// PUT /api/faqs/:id
// ============================================================

router.put(
  "/:id",
  authenticateAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;

      const {
        question,
        answer,
        display_order,
        is_published,
      } = req.body;

      if (!/^\d+$/.test(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid FAQ ID.",
        });
      }

      if (
        !question ||
        !question.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Question is required.",
        });
      }

      if (
        !answer ||
        !answer.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Answer is required.",
        });
      }

      if (question.trim().length > 500) {
        return res.status(400).json({
          success: false,
          message:
            "Question cannot exceed 500 characters.",
        });
      }

      const order = Number.isInteger(
        Number(display_order)
      )
        ? Number(display_order)
        : 0;

      const published =
        is_published === false ||
        is_published === 0
          ? 0
          : 1;

      const [existing] =
        await pool.execute(
          `
          SELECT id
          FROM faqs
          WHERE id = ?
          LIMIT 1
          `,
          [id]
        );

      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          message: "FAQ not found.",
        });
      }

      await pool.execute(
        `
        UPDATE faqs
        SET
          question = ?,
          answer = ?,
          display_order = ?,
          is_published = ?
        WHERE id = ?
        `,
        [
          question.trim(),
          answer.trim(),
          order,
          published,
          id,
        ]
      );

      return res.json({
        success: true,
        message:
          "FAQ updated successfully.",
      });
    } catch (error) {
      console.error(
        "UPDATE FAQ ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to update FAQ.",
      });
    }
  }
);

// ============================================================
// ADMIN — DELETE FAQ
// DELETE /api/faqs/:id
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
          message: "Invalid FAQ ID.",
        });
      }

      const [result] =
        await pool.execute(
          `
          DELETE FROM faqs
          WHERE id = ?
          `,
          [id]
        );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "FAQ not found.",
        });
      }

      return res.json({
        success: true,
        message:
          "FAQ deleted successfully.",
      });
    } catch (error) {
      console.error(
        "DELETE FAQ ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to delete FAQ.",
      });
    }
  }
);

// ============================================================
// EXPORT
// ============================================================

module.exports = router;