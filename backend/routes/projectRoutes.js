const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const { pool } = require("../config/db");
const { authenticateAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

// ============================================================
// PROJECT IMAGE UPLOAD CONFIGURATION
// ============================================================

const uploadDir = path.join(
  __dirname,
  "..",
  "uploads",
  "projects"
);

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const extension = path
      .extname(file.originalname)
      .toLowerCase();

    const safeBaseName = path
      .basename(file.originalname, extension)
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60);

    const finalBaseName = safeBaseName || "project";

    cb(
      null,
      `${finalBaseName}-${Date.now()}-${Math.round(
        Math.random() * 1e9
      )}${extension}`
    );
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  if (!allowedTypes.includes(file.mimetype)) {
    return cb(
      new Error(
        "Only JPG, PNG and WEBP images are allowed."
      )
    );
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

// ============================================================
// HELPERS
// ============================================================

const deleteUploadedFile = (imageUrl) => {
  if (!imageUrl) return;

  if (!imageUrl.startsWith("/uploads/projects/")) {
    return;
  }

  const filename = path.basename(imageUrl);

  if (!filename) return;

  const filePath = path.join(uploadDir, filename);

  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error(
      "PROJECT IMAGE DELETE ERROR:",
      error
    );
  }
};

const getUploadedImageUrl = (req) => {
  if (!req.file) return null;

  return `/uploads/projects/${req.file.filename}`;
};

const toBoolean = (value, fallback = false) => {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return fallback;
  }

  if (typeof value === "boolean") {
    return value;
  }

  return (
    value === true ||
    value === 1 ||
    value === "1" ||
    String(value).toLowerCase() === "true"
  );
};

const toInteger = (value, fallback = 0) => {
  const number = Number(value);

  return Number.isInteger(number)
    ? number
    : fallback;
};

const cleanOptionalString = (value) => {
  if (
    value === undefined ||
    value === null
  ) {
    return null;
  }

  const cleaned = String(value).trim();

  return cleaned ? cleaned : null;
};

// ============================================================
// GET ALL PUBLISHED PROJECTS
// GET /api/projects
// ============================================================

router.get("/", async (req, res) => {
  try {
    const [projects] = await pool.execute(`
      SELECT
        id,
        title,
        slug,
        short_description,
        description,
        cover_image,
        project_date,
        location,
        status,
        is_featured,
        is_published,
        display_order,
        created_at,
        updated_at
      FROM projects
      WHERE is_published = TRUE
      ORDER BY
        display_order ASC,
        project_date DESC,
        id DESC
    `);

    res.json({
      success: true,
      count: projects.length,
      projects,
    });
  } catch (error) {
    console.error(
      "GET PROJECTS ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Unable to fetch projects.",
    });
  }
});

// ============================================================
// GET PROJECT BY ID
// GET /api/projects/:id
// ============================================================

router.get("/:id", async (req, res) => {
  try {
    const projectId = Number(
      req.params.id
    );

    if (
      !Number.isInteger(projectId) ||
      projectId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID.",
      });
    }

    const [projects] = await pool.execute(
      `
      SELECT
        id,
        title,
        slug,
        short_description,
        description,
        cover_image,
        project_date,
        location,
        status,
        is_featured,
        is_published,
        display_order,
        created_at,
        updated_at
      FROM projects
      WHERE id = ?
      LIMIT 1
      `,
      [projectId]
    );

    if (projects.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    res.json({
      success: true,
      project: projects[0],
    });
  } catch (error) {
    console.error(
      "GET PROJECT ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Unable to fetch project.",
    });
  }
});

// ============================================================
// CREATE PROJECT
// POST /api/projects
//
// Supports:
// 1. application/json
// 2. multipart/form-data with image field
// ============================================================

router.post(
  "/",
  authenticateAdmin,
  upload.single("image"),
  async (req, res) => {
    const uploadedImageUrl =
      getUploadedImageUrl(req);

    try {
      const {
        title,
        slug,
        short_description,
        description,
        cover_image,
        project_date,
        location,
        status,
        is_featured,
        is_published,
        display_order,
      } = req.body || {};

      // --------------------------------------------------------
      // TITLE
      // --------------------------------------------------------

      if (
        !title ||
        !String(title).trim()
      ) {
        deleteUploadedFile(
          uploadedImageUrl
        );

        return res.status(400).json({
          success: false,
          message:
            "Project title is required.",
        });
      }

      // --------------------------------------------------------
      // SLUG
      // --------------------------------------------------------

      if (
        !slug ||
        !String(slug).trim()
      ) {
        deleteUploadedFile(
          uploadedImageUrl
        );

        return res.status(400).json({
          success: false,
          message:
            "Project slug is required.",
        });
      }

      // --------------------------------------------------------
      // STATUS
      // --------------------------------------------------------

      const projectStatus = [
        "upcoming",
        "ongoing",
        "completed",
      ].includes(status)
        ? status
        : "completed";

      // --------------------------------------------------------
      // COVER IMAGE
      // --------------------------------------------------------

      const finalCoverImage =
        uploadedImageUrl ||
        cleanOptionalString(
          cover_image
        );

      // --------------------------------------------------------
      // PROJECT DATE
      // --------------------------------------------------------

      const finalProjectDate =
        project_date &&
        String(project_date).trim()
          ? String(project_date).trim()
          : null;

      // --------------------------------------------------------
      // INSERT
      // --------------------------------------------------------

      const [result] =
        await pool.execute(
          `
          INSERT INTO projects
          (
            title,
            slug,
            short_description,
            description,
            cover_image,
            project_date,
            location,
            status,
            is_featured,
            is_published,
            display_order
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            String(title).trim(),

            String(slug).trim(),

            cleanOptionalString(
              short_description
            ),

            cleanOptionalString(
              description
            ),

            finalCoverImage,

            finalProjectDate,

            cleanOptionalString(
              location
            ),

            projectStatus,

            toBoolean(
              is_featured,
              false
            ),

            toBoolean(
              is_published,
              true
            ),

            toInteger(
              display_order,
              0
            ),
          ]
        );

      res.status(201).json({
        success: true,
        message:
          "Project created successfully.",
        projectId:
          result.insertId,
        cover_image:
          finalCoverImage,
      });
    } catch (error) {
      console.error(
        "CREATE PROJECT ERROR:",
        error
      );

      // Delete uploaded image if
      // database insertion failed.
      deleteUploadedFile(
        uploadedImageUrl
      );

      // Duplicate slug
      if (
        error.code === "ER_DUP_ENTRY"
      ) {
        return res.status(409).json({
          success: false,
          message:
            "A project with this slug already exists.",
        });
      }

      res.status(500).json({
        success: false,
        message:
          "Unable to create project.",
      });
    }
  }
);

// ============================================================
// UPDATE PROJECT
// PUT /api/projects/:id
//
// Supports:
// 1. application/json
// 2. multipart/form-data with image field
// ============================================================

router.put(
  "/:id",
  authenticateAdmin,
  upload.single("image"),
  async (req, res) => {
    const uploadedImageUrl =
      getUploadedImageUrl(req);

    try {
      const projectId = Number(
        req.params.id
      );

      if (
        !Number.isInteger(projectId) ||
        projectId <= 0
      ) {
        deleteUploadedFile(
          uploadedImageUrl
        );

        return res.status(400).json({
          success: false,
          message:
            "Invalid project ID.",
        });
      }

      // --------------------------------------------------------
      // GET EXISTING PROJECT
      // --------------------------------------------------------

      const [existingRows] =
        await pool.execute(
          `
          SELECT cover_image
          FROM projects
          WHERE id = ?
          LIMIT 1
          `,
          [projectId]
        );

      if (
        existingRows.length === 0
      ) {
        deleteUploadedFile(
          uploadedImageUrl
        );

        return res.status(404).json({
          success: false,
          message:
            "Project not found.",
        });
      }

      const oldCoverImage =
        existingRows[0]
          .cover_image;

      // --------------------------------------------------------
      // BODY
      // --------------------------------------------------------

      const {
        title,
        slug,
        short_description,
        description,
        cover_image,
        project_date,
        location,
        status,
        is_featured,
        is_published,
        display_order,
        remove_cover_image,
      } = req.body || {};

      // --------------------------------------------------------
      // TITLE
      // --------------------------------------------------------

      if (
        !title ||
        !String(title).trim()
      ) {
        deleteUploadedFile(
          uploadedImageUrl
        );

        return res.status(400).json({
          success: false,
          message:
            "Project title is required.",
        });
      }

      // --------------------------------------------------------
      // SLUG
      // --------------------------------------------------------

      if (
        !slug ||
        !String(slug).trim()
      ) {
        deleteUploadedFile(
          uploadedImageUrl
        );

        return res.status(400).json({
          success: false,
          message:
            "Project slug is required.",
        });
      }

      // --------------------------------------------------------
      // STATUS
      // --------------------------------------------------------

      const projectStatus = [
        "upcoming",
        "ongoing",
        "completed",
      ].includes(status)
        ? status
        : "completed";

      // --------------------------------------------------------
      // COVER IMAGE
      // --------------------------------------------------------

      let finalCoverImage =
        oldCoverImage;

      // New cropped image
      if (uploadedImageUrl) {
        finalCoverImage =
          uploadedImageUrl;
      }

      // Remove image
      else if (
        toBoolean(
          remove_cover_image,
          false
        )
      ) {
        finalCoverImage = null;
      }

      // Manually entered URL
      else if (
        cover_image !== undefined
      ) {
        finalCoverImage =
          cleanOptionalString(
            cover_image
          );
      }

      // --------------------------------------------------------
      // PROJECT DATE
      // --------------------------------------------------------

      const finalProjectDate =
        project_date &&
        String(project_date).trim()
          ? String(project_date).trim()
          : null;

      // --------------------------------------------------------
      // UPDATE
      // --------------------------------------------------------

      const [result] =
        await pool.execute(
          `
          UPDATE projects
          SET
            title = ?,
            slug = ?,
            short_description = ?,
            description = ?,
            cover_image = ?,
            project_date = ?,
            location = ?,
            status = ?,
            is_featured = ?,
            is_published = ?,
            display_order = ?
          WHERE id = ?
          `,
          [
            String(title).trim(),

            String(slug).trim(),

            cleanOptionalString(
              short_description
            ),

            cleanOptionalString(
              description
            ),

            finalCoverImage,

            finalProjectDate,

            cleanOptionalString(
              location
            ),

            projectStatus,

            toBoolean(
              is_featured,
              false
            ),

            toBoolean(
              is_published,
              true
            ),

            toInteger(
              display_order,
              0
            ),

            projectId,
          ]
        );

      if (
        result.affectedRows === 0
      ) {
        deleteUploadedFile(
          uploadedImageUrl
        );

        return res.status(404).json({
          success: false,
          message:
            "Project not found.",
        });
      }

      // --------------------------------------------------------
      // DELETE OLD IMAGE AFTER
      // SUCCESSFUL DATABASE UPDATE
      // --------------------------------------------------------

      if (
        uploadedImageUrl &&
        oldCoverImage &&
        oldCoverImage !==
          uploadedImageUrl
      ) {
        deleteUploadedFile(
          oldCoverImage
        );
      }

      // --------------------------------------------------------
      // DELETE IMAGE WHEN REMOVED
      // --------------------------------------------------------

      if (
        !uploadedImageUrl &&
        toBoolean(
          remove_cover_image,
          false
        ) &&
        oldCoverImage
      ) {
        deleteUploadedFile(
          oldCoverImage
        );
      }

      res.json({
        success: true,
        message:
          "Project updated successfully.",
        cover_image:
          finalCoverImage,
      });
    } catch (error) {
      console.error(
        "UPDATE PROJECT ERROR:",
        error
      );

      // Remove newly uploaded image
      // if database update failed.
      deleteUploadedFile(
        uploadedImageUrl
      );

      // Duplicate slug
      if (
        error.code === "ER_DUP_ENTRY"
      ) {
        return res.status(409).json({
          success: false,
          message:
            "A project with this slug already exists.",
        });
      }

      res.status(500).json({
        success: false,
        message:
          "Unable to update project.",
      });
    }
  }
);

// ============================================================
// DELETE PROJECT
// DELETE /api/projects/:id
// ============================================================

router.delete(
  "/:id",
  authenticateAdmin,
  async (req, res) => {
    try {
      const projectId = Number(
        req.params.id
      );

      if (
        !Number.isInteger(projectId) ||
        projectId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid project ID.",
        });
      }

      // --------------------------------------------------------
      // GET IMAGE BEFORE DELETE
      // --------------------------------------------------------

      const [projects] =
        await pool.execute(
          `
          SELECT cover_image
          FROM projects
          WHERE id = ?
          LIMIT 1
          `,
          [projectId]
        );

      if (projects.length === 0) {
        return res.status(404).json({
          success: false,
          message:
            "Project not found.",
        });
      }

      const oldCoverImage =
        projects[0]
          .cover_image;

      // --------------------------------------------------------
      // DELETE DATABASE RECORD
      // --------------------------------------------------------

      const [result] =
        await pool.execute(
          `
          DELETE FROM projects
          WHERE id = ?
          `,
          [projectId]
        );

      if (
        result.affectedRows === 0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Project not found.",
        });
      }

      // --------------------------------------------------------
      // DELETE PHYSICAL IMAGE
      // --------------------------------------------------------

      deleteUploadedFile(
        oldCoverImage
      );

      res.json({
        success: true,
        message:
          "Project deleted successfully.",
      });
    } catch (error) {
      console.error(
        "DELETE PROJECT ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Unable to delete project.",
      });
    }
  }
);

// ============================================================
// MULTER ERROR HANDLER
// ============================================================

router.use(
  (error, req, res, next) => {
    if (
      error instanceof
      multer.MulterError
    ) {
      if (
        error.code ===
        "LIMIT_FILE_SIZE"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Image must be 5MB or smaller.",
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
        message:
          error.message ||
          "Image upload failed.",
      });
    }

    next();
  }
);

module.exports = router;