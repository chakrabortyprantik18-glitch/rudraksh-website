const express = require("express");

const { authenticateAdmin } = require("../middleware/authMiddleware");
const { pool } = require("../config/db");

const router = express.Router();

/*
==================================================
PUBLIC
GET /api/social-links
Returns only active social links
==================================================
*/

router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `
      SELECT
        id,
        platform,
        url,
        icon,
        display_order
      FROM social_links
      WHERE is_active = 1
      ORDER BY display_order ASC, id ASC
      `
    );

    return res.json({
      success: true,
      socialLinks: rows,
    });
  } catch (error) {
    console.error("GET SOCIAL LINKS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch social links.",
    });
  }
});

/*
==================================================
ADMIN
GET /api/social-links/admin
Returns all social links
==================================================
*/

router.get(
  "/admin",
  authenticateAdmin,
  async (req, res) => {
    try {
      const [rows] = await pool.query(
        `
        SELECT
          id,
          platform,
          url,
          icon,
          display_order,
          is_active,
          created_at,
          updated_at
        FROM social_links
        ORDER BY display_order ASC, id ASC
        `
      );

      return res.json({
        success: true,
        socialLinks: rows,
      });
    } catch (error) {
      console.error(
        "ADMIN GET SOCIAL LINKS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Failed to fetch social links.",
      });
    }
  }
);

/*
==================================================
ADMIN
GET /api/social-links/:id
==================================================
*/

router.get(
  "/:id",
  authenticateAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;

      const [rows] = await pool.query(
        `
        SELECT
          id,
          platform,
          url,
          icon,
          display_order,
          is_active,
          created_at,
          updated_at
        FROM social_links
        WHERE id = ?
        LIMIT 1
        `,
        [id]
      );

      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Social link not found.",
        });
      }

      return res.json({
        success: true,
        socialLink: rows[0],
      });
    } catch (error) {
      console.error(
        "GET SOCIAL LINK ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Failed to fetch social link.",
      });
    }
  }
);

/*
==================================================
ADMIN
POST /api/social-links
Create new social link
==================================================
*/

router.post(
  "/",
  authenticateAdmin,
  async (req, res) => {
    try {
      const {
        platform,
        url,
        icon,
        display_order,
        is_active,
      } = req.body;

      if (
        !platform ||
        typeof platform !== "string" ||
        !platform.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Platform is required.",
        });
      }

      if (
        !url ||
        typeof url !== "string" ||
        !url.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "URL is required.",
        });
      }

      const cleanPlatform =
        platform.trim();

      const cleanUrl = url.trim();

      const cleanIcon =
        icon &&
        typeof icon === "string"
          ? icon.trim()
          : null;

      const order =
        Number.isFinite(
          Number(display_order)
        )
          ? Number(display_order)
          : 0;

      const active =
        is_active === undefined ||
        is_active === null
          ? 1
          : Number(is_active) === 1
          ? 1
          : 0;

      const [existing] = await pool.query(
        `
        SELECT id
        FROM social_links
        WHERE platform = ?
        LIMIT 1
        `,
        [cleanPlatform]
      );

      if (existing.length > 0) {
        return res.status(409).json({
          success: false,
          message:
            "A social link for this platform already exists.",
        });
      }

      const [result] = await pool.query(
        `
        INSERT INTO social_links
        (
          platform,
          url,
          icon,
          display_order,
          is_active
        )
        VALUES (?, ?, ?, ?, ?)
        `,
        [
          cleanPlatform,
          cleanUrl,
          cleanIcon,
          order,
          active,
        ]
      );

      return res.status(201).json({
        success: true,
        message:
          "Social link created successfully.",
        socialLinkId: result.insertId,
      });
    } catch (error) {
      console.error(
        "CREATE SOCIAL LINK ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Failed to create social link.",
      });
    }
  }
);

/*
==================================================
ADMIN
PUT /api/social-links/:id
Update social link
==================================================
*/

router.put(
  "/:id",
  authenticateAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;

      const {
        platform,
        url,
        icon,
        display_order,
        is_active,
      } = req.body;

      const [existingRows] =
        await pool.query(
          `
          SELECT id
          FROM social_links
          WHERE id = ?
          LIMIT 1
          `,
          [id]
        );

      if (existingRows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Social link not found.",
        });
      }

      if (
        platform !== undefined &&
        (
          typeof platform !== "string" ||
          !platform.trim()
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "Platform cannot be empty.",
        });
      }

      if (
        url !== undefined &&
        (
          typeof url !== "string" ||
          !url.trim()
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "URL cannot be empty.",
        });
      }

      if (platform !== undefined) {
        const [duplicate] =
          await pool.query(
            `
            SELECT id
            FROM social_links
            WHERE platform = ?
              AND id <> ?
            LIMIT 1
            `,
            [platform.trim(), id]
          );

        if (duplicate.length > 0) {
          return res.status(409).json({
            success: false,
            message:
              "Another social link already uses this platform.",
          });
        }
      }

      const fields = [];
      const values = [];

      if (platform !== undefined) {
        fields.push("platform = ?");
        values.push(platform.trim());
      }

      if (url !== undefined) {
        fields.push("url = ?");
        values.push(url.trim());
      }

      if (icon !== undefined) {
        fields.push("icon = ?");
        values.push(
          icon &&
          typeof icon === "string"
            ? icon.trim()
            : null
        );
      }

      if (display_order !== undefined) {
        fields.push("display_order = ?");
        values.push(
          Number.isFinite(
            Number(display_order)
          )
            ? Number(display_order)
            : 0
        );
      }

      if (is_active !== undefined) {
        fields.push("is_active = ?");
        values.push(
          Number(is_active) === 1
            ? 1
            : 0
        );
      }

      if (fields.length === 0) {
        return res.status(400).json({
          success: false,
          message:
            "No fields were provided for update.",
        });
      }

      values.push(id);

      await pool.query(
        `
        UPDATE social_links
        SET ${fields.join(", ")}
        WHERE id = ?
        `,
        values
      );

      return res.json({
        success: true,
        message:
          "Social link updated successfully.",
      });
    } catch (error) {
      console.error(
        "UPDATE SOCIAL LINK ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Failed to update social link.",
      });
    }
  }
);

/*
==================================================
ADMIN
DELETE /api/social-links/:id
==================================================
*/

router.delete(
  "/:id",
  authenticateAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;

      const [result] = await pool.query(
        `
        DELETE FROM social_links
        WHERE id = ?
        `,
        [id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Social link not found.",
        });
      }

      return res.json({
        success: true,
        message:
          "Social link deleted successfully.",
      });
    } catch (error) {
      console.error(
        "DELETE SOCIAL LINK ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Failed to delete social link.",
      });
    }
  }
);

module.exports = router;