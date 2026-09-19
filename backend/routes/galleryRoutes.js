const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const { pool } = require("../config/db");
const { authenticateAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

// ============================================================
// UPLOAD DIRECTORY
// ============================================================

const uploadDirectory = path.join(
  __dirname,
  "..",
  "uploads",
  "gallery"
);

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, {
    recursive: true,
  });
}

// ============================================================
// MULTER STORAGE
// ============================================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },

  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();

    const uniqueName =
      `gallery-${Date.now()}-${Math.round(Math.random() * 1e9)}` +
      extension;

    cb(null, uniqueName);
  },
});

// ============================================================
// FILE FILTER
// ============================================================

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
  ];

  if (!allowedTypes.includes(file.mimetype)) {
    return cb(
      new Error(
        "Only JPG, PNG, WEBP and GIF images are allowed."
      )
    );
  }

  cb(null, true);
};

// ============================================================
// MULTER CONFIGURATION
// ============================================================

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

// ============================================================
// GET PUBLISHED GALLERY
// GET /api/gallery
// ============================================================

router.get("/", async (req, res) => {
  try {
    const [images] = await pool.execute(`
      SELECT
        id,
        title,
        description,
        image_url,
        category,
        event_id,
        project_id,
        display_order,
        is_published,
        created_at,
        updated_at
      FROM gallery
      WHERE is_published = TRUE
      ORDER BY display_order ASC, id DESC
    `);

    res.json({
      success: true,
      count: images.length,
      gallery: images,
    });
  } catch (error) {
    console.error("GET GALLERY ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch gallery.",
    });
  }
});

// ============================================================
// GET GALLERY ITEM
// GET /api/gallery/:id
// ============================================================

router.get("/:id", async (req, res) => {
  try {
    const galleryId = Number(req.params.id);

    if (!Number.isInteger(galleryId) || galleryId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid gallery ID.",
      });
    }

    const [images] = await pool.execute(
      `
      SELECT
        id,
        title,
        description,
        image_url,
        category,
        event_id,
        project_id,
        display_order,
        is_published,
        created_at,
        updated_at
      FROM gallery
      WHERE id = ?
      LIMIT 1
      `,
      [galleryId]
    );

    if (images.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Gallery image not found.",
      });
    }

    res.json({
      success: true,
      gallery: images[0],
    });
  } catch (error) {
    console.error("GET GALLERY ITEM ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch gallery image.",
    });
  }
});

// ============================================================
// UPLOAD GALLERY IMAGE
// POST /api/gallery
// ============================================================

router.post(
  "/",
  authenticateAdmin,
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Please select an image.",
        });
      }

      const {
        title,
        description,
        category,
        event_id,
        project_id,
        display_order,
        is_published,
      } = req.body;

      const imageUrl = `/uploads/gallery/${req.file.filename}`;

      const [result] = await pool.execute(
        `
        INSERT INTO gallery
        (
          title,
          description,
          image_url,
          category,
          event_id,
          project_id,
          display_order,
          is_published
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          title ? title.trim() : null,
          description || null,
          imageUrl,
          category || null,
          event_id || null,
          project_id || null,
          Number.isInteger(Number(display_order))
            ? Number(display_order)
            : 0,
          is_published !== undefined
            ? String(is_published) === "true"
            : true,
        ]
      );

      res.status(201).json({
        success: true,
        message: "Gallery image uploaded successfully.",
        galleryId: result.insertId,
        imageUrl,
      });
    } catch (error) {
      console.error("UPLOAD GALLERY ERROR:", error);

      // Delete uploaded file if database insertion fails
      if (req.file) {
        const uploadedFile = path.join(
          uploadDirectory,
          req.file.filename
        );

        if (fs.existsSync(uploadedFile)) {
          fs.unlinkSync(uploadedFile);
        }
      }

      res.status(500).json({
        success: false,
        message: "Unable to upload gallery image.",
      });
    }
  }
);

// ============================================================
// UPDATE GALLERY ITEM
// PUT /api/gallery/:id
// ============================================================

router.put("/:id", authenticateAdmin, async (req, res) => {
  try {
    const galleryId = Number(req.params.id);

    if (!Number.isInteger(galleryId) || galleryId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid gallery ID.",
      });
    }

    const {
      title,
      description,
      category,
      event_id,
      project_id,
      display_order,
      is_published,
    } = req.body;

    const [result] = await pool.execute(
      `
      UPDATE gallery
      SET
        title = ?,
        description = ?,
        category = ?,
        event_id = ?,
        project_id = ?,
        display_order = ?,
        is_published = ?
      WHERE id = ?
      `,
      [
        title ? title.trim() : null,
        description || null,
        category || null,
        event_id || null,
        project_id || null,
        Number.isInteger(Number(display_order))
          ? Number(display_order)
          : 0,
        is_published !== undefined
          ? Boolean(is_published)
          : true,
        galleryId,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Gallery image not found.",
      });
    }

    res.json({
      success: true,
      message: "Gallery item updated successfully.",
    });
  } catch (error) {
    console.error("UPDATE GALLERY ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Unable to update gallery item.",
    });
  }
});

// ============================================================
// DELETE GALLERY ITEM
// DELETE /api/gallery/:id
// ============================================================

router.delete("/:id", authenticateAdmin, async (req, res) => {
  try {
    const galleryId = Number(req.params.id);

    if (!Number.isInteger(galleryId) || galleryId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid gallery ID.",
      });
    }

    const [images] = await pool.execute(
      `
      SELECT image_url
      FROM gallery
      WHERE id = ?
      LIMIT 1
      `,
      [galleryId]
    );

    if (images.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Gallery image not found.",
      });
    }

    const imageUrl = images[0].image_url;

    const [result] = await pool.execute(
      `
      DELETE FROM gallery
      WHERE id = ?
      `,
      [galleryId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Gallery image not found.",
      });
    }

    // Delete physical image
    if (imageUrl && imageUrl.startsWith("/uploads/gallery/")) {
      const filename = path.basename(imageUrl);

      const filePath = path.join(
        uploadDirectory,
        filename
      );

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    res.json({
      success: true,
      message: "Gallery image deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE GALLERY ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Unable to delete gallery image.",
    });
  }
});

// ============================================================
// MULTER ERROR HANDLER
// ============================================================

router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "Image must be smaller than 5 MB.",
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  next();
});

// ============================================================
// EXPORT
// ============================================================

module.exports = router;