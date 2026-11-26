const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const { pool } = require("../config/db");
const { authenticateAdmin } = require("../middleware/authMiddleware");
const {
  MEMBERSHIP_UPLOAD_DIR,
} = require("../config/uploadPaths");

const router = express.Router();

/* =========================================================
   MEMBERSHIP PHOTO UPLOAD
========================================================= */

const uploadDirectory = MEMBERSHIP_UPLOAD_DIR;

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, {
    recursive: true,
  });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },

  filename: (req, file, cb) => {
    const extension = path
      .extname(file.originalname)
      .toLowerCase();

    const filename =
      `membership-${Date.now()}-${Math.round(
        Math.random() * 1e9
      )}${extension}`;

    cb(null, filename);
  },
});

const upload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },

  fileFilter: (req, file, cb) => {
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
  },
});

/* =========================================================
   PUBLIC
   SUBMIT MEMBERSHIP APPLICATION
   POST /api/membership
========================================================= */

router.post(
  "/",
  upload.single("photo"),
  async (req, res) => {
    try {
      const {
        full_name,
        email,
        phone,
        address,
        date_of_birth,
        occupation,
        reason,
      } = req.body;

      /* -----------------------------------------------------
         REQUIRED FIELDS
      ----------------------------------------------------- */

      if (!full_name || !full_name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Full name is required.",
        });
      }

      if (!phone || !phone.trim()) {
        return res.status(400).json({
          success: false,
          message: "Phone number is required.",
        });
      }

      /* -----------------------------------------------------
         FIELD VALIDATION
      ----------------------------------------------------- */

      if (full_name.trim().length > 150) {
        return res.status(400).json({
          success: false,
          message:
            "Full name must be 150 characters or less.",
        });
      }

      if (phone.trim().length > 30) {
        return res.status(400).json({
          success: false,
          message:
            "Phone number must be 30 characters or less.",
        });
      }

      if (email && email.trim().length > 255) {
        return res.status(400).json({
          success: false,
          message:
            "Email address is too long.",
        });
      }

      if (
        occupation &&
        occupation.trim().length > 150
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Occupation must be 150 characters or less.",
        });
      }

      /* -----------------------------------------------------
         EMAIL VALIDATION
      ----------------------------------------------------- */

      if (email && email.trim()) {
        const emailPattern =
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(email.trim())) {
          return res.status(400).json({
            success: false,
            message:
              "Please enter a valid email address.",
          });
        }
      }

      /* -----------------------------------------------------
         DATE OF BIRTH
      ----------------------------------------------------- */

      let dateOfBirth = null;

      if (
        date_of_birth &&
        date_of_birth.trim()
      ) {
        const parsedDate = new Date(
          `${date_of_birth}T00:00:00`
        );

        if (Number.isNaN(parsedDate.getTime())) {
          return res.status(400).json({
            success: false,
            message:
              "Please enter a valid date of birth.",
          });
        }

        dateOfBirth = date_of_birth;
      }

      /* -----------------------------------------------------
         PHOTO
      ----------------------------------------------------- */

      let photoUrl = null;

      if (req.file) {
        photoUrl =
          `/uploads/membership/${req.file.filename}`;
      }

      /* -----------------------------------------------------
         INSERT INTO DATABASE
      ----------------------------------------------------- */

      const [result] = await pool.execute(
        `
        INSERT INTO membership_applications
        (
          full_name,
          email,
          phone,
          address,
          date_of_birth,
          occupation,
          reason,
          photo_url,
          status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
        `,
        [
          full_name.trim(),

          email && email.trim()
            ? email.trim()
            : null,

          phone.trim(),

          address && address.trim()
            ? address.trim()
            : null,

          dateOfBirth,

          occupation && occupation.trim()
            ? occupation.trim()
            : null,

          reason && reason.trim()
            ? reason.trim()
            : null,

          photoUrl,
        ]
      );

      /* -----------------------------------------------------
         SUCCESS RESPONSE
      ----------------------------------------------------- */

      return res.status(201).json({
        success: true,
        message:
          "Membership application submitted successfully.",
        applicationId: result.insertId,
      });
    } catch (error) {
      console.error(
        "======================================"
      );

      console.error(
        "CREATE MEMBERSHIP APPLICATION ERROR"
      );

      console.error(
        "======================================"
      );

      console.error(error);

      /* -----------------------------------------------------
         DELETE PHOTO IF DATABASE INSERT FAILED
      ----------------------------------------------------- */

      if (req.file) {
        try {
          if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
          }
        } catch (cleanupError) {
          console.error(
            "MEMBERSHIP PHOTO CLEANUP ERROR:",
            cleanupError
          );
        }
      }

      return res.status(500).json({
        success: false,
        message:
          "Unable to submit membership application.",
      });
    }
  }
);

/* =========================================================
   GET ALL MEMBERSHIP APPLICATIONS
   GET /api/membership
   ADMIN ONLY
========================================================= */

router.get(
  "/",
  authenticateAdmin,
  async (req, res) => {
    try {
      const [applications] =
        await pool.execute(
          `
          SELECT
            ma.id,
            ma.full_name,
            ma.email,
            ma.phone,
            ma.address,
            ma.date_of_birth,
            ma.occupation,
            ma.reason,
            ma.photo_url,
            ma.status,
            ma.reviewed_by,
            ma.reviewed_at,
            ma.admin_notes,
            ma.created_at,
            ma.updated_at,
            a.name AS reviewer_name
          FROM membership_applications ma
          LEFT JOIN admins a
            ON ma.reviewed_by = a.id
          ORDER BY ma.created_at DESC
          `
        );

      return res.json({
        success: true,
        applications,
      });
    } catch (error) {
      console.error(
        "======================================"
      );

      console.error(
        "GET MEMBERSHIP APPLICATIONS ERROR"
      );

      console.error(
        "======================================"
      );

      console.error(error);

      return res.status(500).json({
        success: false,
        message:
          "Unable to load membership applications.",
      });
    }
  }
);

/* =========================================================
   GET SINGLE MEMBERSHIP APPLICATION
   GET /api/membership/:id
   ADMIN ONLY
========================================================= */

router.get(
  "/:id",
  authenticateAdmin,
  async (req, res) => {
    try {
      const applicationId =
        Number(req.params.id);

      if (
        !Number.isInteger(applicationId) ||
        applicationId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid membership application ID.",
        });
      }

      const [applications] =
        await pool.execute(
          `
          SELECT
            ma.id,
            ma.full_name,
            ma.email,
            ma.phone,
            ma.address,
            ma.date_of_birth,
            ma.occupation,
            ma.reason,
            ma.photo_url,
            ma.status,
            ma.reviewed_by,
            ma.reviewed_at,
            ma.admin_notes,
            ma.created_at,
            ma.updated_at,
            a.name AS reviewer_name
          FROM membership_applications ma
          LEFT JOIN admins a
            ON ma.reviewed_by = a.id
          WHERE ma.id = ?
          LIMIT 1
          `,
          [applicationId]
        );

      if (applications.length === 0) {
        return res.status(404).json({
          success: false,
          message:
            "Membership application not found.",
        });
      }

      return res.json({
        success: true,
        application: applications[0],
      });
    } catch (error) {
      console.error(
        "GET MEMBERSHIP APPLICATION ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load membership application.",
      });
    }
  }
);

/* =========================================================
   UPDATE MEMBERSHIP APPLICATION
   PUT /api/membership/:id
   ADMIN ONLY
========================================================= */

router.put(
  "/:id",
  authenticateAdmin,
  async (req, res) => {
    try {
      const applicationId =
        Number(req.params.id);

      if (
        !Number.isInteger(applicationId) ||
        applicationId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid membership application ID.",
        });
      }

      const {
        status,
        admin_notes,
      } = req.body;

      const allowedStatuses = [
        "pending",
        "approved",
        "rejected",
      ];

      if (
        status !== undefined &&
        !allowedStatuses.includes(status)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid application status.",
        });
      }

      const [existing] =
        await pool.execute(
          `
          SELECT
            id,
            status,
            admin_notes
          FROM membership_applications
          WHERE id = ?
          LIMIT 1
          `,
          [applicationId]
        );

      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          message:
            "Membership application not found.",
        });
      }

      const current = existing[0];

      const nextStatus =
        status !== undefined
          ? status
          : current.status;

      const nextNotes =
        admin_notes !== undefined
          ? admin_notes
          : current.admin_notes;

      const isBeingReviewed =
        status !== undefined &&
        status !== "pending";

      if (isBeingReviewed) {
        await pool.execute(
          `
          UPDATE membership_applications
          SET
            status = ?,
            admin_notes = ?,
            reviewed_by = ?,
            reviewed_at = NOW()
          WHERE id = ?
          `,
          [
            nextStatus,
            nextNotes || null,
            req.admin.id,
            applicationId,
          ]
        );
      } else {
        await pool.execute(
          `
          UPDATE membership_applications
          SET
            status = ?,
            admin_notes = ?
          WHERE id = ?
          `,
          [
            nextStatus,
            nextNotes || null,
            applicationId,
          ]
        );
      }

      const [updated] =
        await pool.execute(
          `
          SELECT
            ma.id,
            ma.full_name,
            ma.email,
            ma.phone,
            ma.address,
            ma.date_of_birth,
            ma.occupation,
            ma.reason,
            ma.photo_url,
            ma.status,
            ma.reviewed_by,
            ma.reviewed_at,
            ma.admin_notes,
            ma.created_at,
            ma.updated_at,
            a.name AS reviewer_name
          FROM membership_applications ma
          LEFT JOIN admins a
            ON ma.reviewed_by = a.id
          WHERE ma.id = ?
          LIMIT 1
          `,
          [applicationId]
        );

      return res.json({
        success: true,
        message:
          "Membership application updated successfully.",
        application: updated[0],
      });
    } catch (error) {
      console.error(
        "======================================"
      );

      console.error(
        "UPDATE MEMBERSHIP APPLICATION ERROR"
      );

      console.error(
        "======================================"
      );

      console.error(error);

      return res.status(500).json({
        success: false,
        message:
          "Unable to update membership application.",
      });
    }
  }
);

/* =========================================================
   DELETE MEMBERSHIP APPLICATION
   DELETE /api/membership/:id
   ADMIN ONLY
========================================================= */

router.delete(
  "/:id",
  authenticateAdmin,
  async (req, res) => {
    try {
      const applicationId =
        Number(req.params.id);

      if (
        !Number.isInteger(applicationId) ||
        applicationId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid membership application ID.",
        });
      }

      const [result] =
        await pool.execute(
          `
          DELETE FROM membership_applications
          WHERE id = ?
          `,
          [applicationId]
        );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message:
            "Membership application not found.",
        });
      }

      return res.json({
        success: true,
        message:
          "Membership application deleted successfully.",
      });
    } catch (error) {
      console.error(
        "DELETE MEMBERSHIP APPLICATION ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to delete membership application.",
      });
    }
  }
);

/* =========================================================
   MULTER ERROR HANDLER
========================================================= */

router.use(
  (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          message:
            "Photo must be smaller than 5 MB.",
        });
      }

      return res.status(400).json({
        success: false,
        message:
          "Photo upload failed.",
      });
    }

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    next();
  }
);

/* =========================================================
   EXPORT
========================================================= */

module.exports = router;