const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const { pool } = require("../config/db");
const {
  authenticateAdmin,
} = require("../middleware/authMiddleware");

const router = express.Router();

/* =========================================================
   UPLOAD DIRECTORY
========================================================= */

const uploadDirectory = path.join(
  __dirname,
  "../uploads/members"
);

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, {
    recursive: true,
  });
}

/* =========================================================
   MULTER STORAGE
========================================================= */

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },

  filename: (req, file, cb) => {
    const extension = path
      .extname(file.originalname)
      .toLowerCase();

    const baseName = path
      .basename(file.originalname, extension)
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .replace(/-+/g, "-")
      .toLowerCase();

    const uniqueName =
      `${Date.now()}-${Math.round(
        Math.random() * 1e9
      )}-${baseName || "member"}${extension}`;

    cb(null, uniqueName);
  },
});

/* =========================================================
   FILE FILTER
========================================================= */

const fileFilter = (
  req,
  file,
  cb
) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  if (
    allowedTypes.includes(
      file.mimetype
    )
  ) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Only JPG, PNG and WEBP images are allowed."
      )
    );
  }
};

/* =========================================================
   MULTER
========================================================= */

const upload = multer({
  storage,
  fileFilter,

  limits: {
    fileSize:
      5 * 1024 * 1024,
  },
});

/* =========================================================
   DELETE IMAGE HELPER
========================================================= */

const deleteUploadedFile = (
  imageUrl
) => {
  if (!imageUrl) {
    return;
  }

  if (
    !imageUrl.startsWith(
      "/uploads/members/"
    )
  ) {
    return;
  }

  const filename =
    path.basename(imageUrl);

  const filePath = path.join(
    uploadDirectory,
    filename
  );

  try {
    if (
      fs.existsSync(filePath)
    ) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error(
      "DELETE MEMBER IMAGE ERROR:",
      error
    );
  }
};

/* =========================================================
   GET ALL MEMBERS
   GET /api/members
========================================================= */

router.get(
  "/",
  async (req, res) => {
    try {
      const [members] =
        await pool.execute(`
          SELECT
            id,
            name,
            position,
            bio,
            photo_url,
            phone,
            email,
            joined_date,
            is_active,
            display_order,
            created_at,
            updated_at
          FROM members
          WHERE is_active = TRUE
          ORDER BY
            display_order ASC,
            id DESC
        `);

      res.json({
        success: true,
        count: members.length,
        members,
      });
    } catch (error) {
      console.error(
        "GET MEMBERS ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Unable to fetch members.",
      });
    }
  }
);

/* =========================================================
   GET MEMBER BY ID
   GET /api/members/:id
========================================================= */

router.get(
  "/:id",
  async (req, res) => {
    try {
      const memberId =
        Number(req.params.id);

      if (
        !Number.isInteger(
          memberId
        ) ||
        memberId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid member ID.",
        });
      }

      const [members] =
        await pool.execute(
          `
          SELECT
            id,
            name,
            position,
            bio,
            photo_url,
            phone,
            email,
            joined_date,
            is_active,
            display_order,
            created_at,
            updated_at
          FROM members
          WHERE id = ?
          LIMIT 1
          `,
          [memberId]
        );

      if (
        members.length === 0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Member not found.",
        });
      }

      res.json({
        success: true,
        member: members[0],
      });
    } catch (error) {
      console.error(
        "GET MEMBER ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Unable to fetch member.",
      });
    }
  }
);

/* =========================================================
   ADD MEMBER
   POST /api/members
========================================================= */

router.post(
  "/",
  authenticateAdmin,
  upload.single("image"),
  async (req, res) => {
    let uploadedImage = null;

    try {
      const {
        name,
        position,
        bio,
        photo_url,
        phone,
        email,
        joined_date,
        is_active,
        display_order,
      } = req.body || {};

      if (
        !name ||
        !name.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Member name is required.",
        });
      }

      /* -----------------------------------------------------
         NEW UPLOADED IMAGE
      ----------------------------------------------------- */

      if (req.file) {
        uploadedImage =
          `/uploads/members/${req.file.filename}`;
      }

      const finalPhoto =
        uploadedImage ||
        photo_url ||
        null;

      const [result] =
        await pool.execute(
          `
          INSERT INTO members
          (
            name,
            position,
            bio,
            photo_url,
            phone,
            email,
            joined_date,
            is_active,
            display_order
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            name.trim(),

            position
              ? position.trim()
              : null,

            bio
              ? bio.trim()
              : null,

            finalPhoto,

            phone
              ? phone.trim()
              : null,

            email
              ? email.trim()
              : null,

            joined_date ||
              null,

            is_active !==
            undefined
              ? String(
                  is_active
                ) === "true"
              : true,

            Number.isInteger(
              Number(
                display_order
              )
            )
              ? Number(
                  display_order
                )
              : 0,
          ]
        );

      res.status(201).json({
        success: true,

        message:
          "Member created successfully.",

        memberId:
          result.insertId,

        photoUrl:
          finalPhoto,
      });
    } catch (error) {
      console.error(
        "CREATE MEMBER ERROR:",
        error
      );

      if (
        uploadedImage
      ) {
        deleteUploadedFile(
          uploadedImage
        );
      }

      res.status(500).json({
        success: false,
        message:
          "Unable to create member.",

        error:
          process.env.NODE_ENV ===
          "development"
            ? error.message
            : undefined,
      });
    }
  }
);

/* =========================================================
   UPDATE MEMBER
   PUT /api/members/:id
========================================================= */

router.put(
  "/:id",
  authenticateAdmin,
  upload.single("image"),
  async (req, res) => {
    let uploadedImage = null;

    try {
      const memberId =
        Number(req.params.id);

      if (
        !Number.isInteger(
          memberId
        ) ||
        memberId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid member ID.",
        });
      }

      /* -----------------------------------------------------
         GET EXISTING MEMBER
      ----------------------------------------------------- */

      const [existingMembers] =
        await pool.execute(
          `
          SELECT
            id,
            photo_url
          FROM members
          WHERE id = ?
          LIMIT 1
          `,
          [memberId]
        );

      if (
        existingMembers.length ===
        0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Member not found.",
        });
      }

      const oldPhoto =
        existingMembers[0]
          .photo_url;

      const {
        name,
        position,
        bio,
        photo_url,
        phone,
        email,
        joined_date,
        is_active,
        display_order,
      } = req.body || {};

      if (
        !name ||
        !name.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Member name is required.",
        });
      }

      /* -----------------------------------------------------
         NEW IMAGE
      ----------------------------------------------------- */

      if (req.file) {
        uploadedImage =
          `/uploads/members/${req.file.filename}`;
      }

      /*
        Priority:

        1. Newly uploaded image
        2. photo_url sent by frontend
        3. Existing database image
      */

      const finalPhoto =
        uploadedImage ||
        photo_url ||
        oldPhoto ||
        null;

      /* -----------------------------------------------------
         UPDATE DATABASE
      ----------------------------------------------------- */

      const [result] =
        await pool.execute(
          `
          UPDATE members
          SET
            name = ?,
            position = ?,
            bio = ?,
            photo_url = ?,
            phone = ?,
            email = ?,
            joined_date = ?,
            is_active = ?,
            display_order = ?
          WHERE id = ?
          `,
          [
            name.trim(),

            position
              ? position.trim()
              : null,

            bio
              ? bio.trim()
              : null,

            finalPhoto,

            phone
              ? phone.trim()
              : null,

            email
              ? email.trim()
              : null,

            joined_date ||
              null,

            is_active !==
            undefined
              ? String(
                  is_active
                ) === "true"
              : true,

            Number.isInteger(
              Number(
                display_order
              )
            )
              ? Number(
                  display_order
                )
              : 0,

            memberId,
          ]
        );

      if (
        result.affectedRows ===
        0
      ) {
        if (
          uploadedImage
        ) {
          deleteUploadedFile(
            uploadedImage
          );
        }

        return res.status(404).json({
          success: false,
          message:
            "Member not found.",
        });
      }

      /* -----------------------------------------------------
         DELETE OLD IMAGE AFTER
         SUCCESSFUL REPLACEMENT
      ----------------------------------------------------- */

      if (
        uploadedImage &&
        oldPhoto &&
        oldPhoto !==
          uploadedImage
      ) {
        deleteUploadedFile(
          oldPhoto
        );
      }

      res.json({
        success: true,

        message:
          "Member updated successfully.",

        photoUrl:
          finalPhoto,
      });
    } catch (error) {
      console.error(
        "UPDATE MEMBER ERROR:",
        error
      );

      if (
        uploadedImage
      ) {
        deleteUploadedFile(
          uploadedImage
        );
      }

      res.status(500).json({
        success: false,
        message:
          "Unable to update member.",

        error:
          process.env.NODE_ENV ===
          "development"
            ? error.message
            : undefined,
      });
    }
  }
);

/* =========================================================
   DELETE MEMBER
   DELETE /api/members/:id
========================================================= */

router.delete(
  "/:id",
  authenticateAdmin,
  async (req, res) => {
    try {
      const memberId =
        Number(req.params.id);

      if (
        !Number.isInteger(
          memberId
        ) ||
        memberId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid member ID.",
        });
      }

      /* -----------------------------------------------------
         GET IMAGE BEFORE DELETE
      ----------------------------------------------------- */

      const [members] =
        await pool.execute(
          `
          SELECT
            photo_url
          FROM members
          WHERE id = ?
          LIMIT 1
          `,
          [memberId]
        );

      if (
        members.length === 0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Member not found.",
        });
      }

      const imageToDelete =
        members[0].photo_url;

      /* -----------------------------------------------------
         DELETE DATABASE RECORD
      ----------------------------------------------------- */

      const [result] =
        await pool.execute(
          `
          DELETE FROM members
          WHERE id = ?
          `,
          [memberId]
        );

      if (
        result.affectedRows ===
        0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Member not found.",
        });
      }

      /* -----------------------------------------------------
         DELETE PHYSICAL IMAGE
      ----------------------------------------------------- */

      if (
        imageToDelete
      ) {
        deleteUploadedFile(
          imageToDelete
        );
      }

      res.json({
        success: true,
        message:
          "Member deleted successfully.",
      });
    } catch (error) {
      console.error(
        "DELETE MEMBER ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Unable to delete member.",
      });
    }
  }
);

/* =========================================================
   MULTER ERROR HANDLER
========================================================= */

router.use(
  (
    error,
    req,
    res,
    next
  ) => {
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
            "Image must be smaller than 5MB.",
        });
      }

      return res.status(400).json({
        success: false,
        message:
          error.message ||
          "Image upload failed.",
      });
    }

    if (
      error &&
      error.message
    ) {
      return res.status(400).json({
        success: false,
        message:
          error.message,
      });
    }

    next(error);
  }
);

module.exports = router;