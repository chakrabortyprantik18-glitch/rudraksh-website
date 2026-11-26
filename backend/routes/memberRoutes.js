const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const { pool } = require("../config/db");
const {
  authenticateAdmin,
} = require("../middleware/authMiddleware");

const {
  MEMBERS_UPLOAD_DIR,
} = require("../config/uploadPaths");

const router = express.Router();

/* =========================================================
   UPLOAD DIRECTORY
========================================================= */

const uploadDirectory = MEMBERS_UPLOAD_DIR;

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

      const limit = Number.parseInt(req.query.limit, 10);
      const output =
        Number.isInteger(limit) && limit > 0
          ? members.slice(
              0,
              Math.min(limit, 100)
            )
          : members;

      res.json({
        success: true,
        count: output.length,
        total: members.length,
        members: output,
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
        member:
          members[0],
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
   CREATE MEMBER
   POST /api/members
========================================================= */

router.post(
  "/",
  authenticateAdmin,
  upload.single("image"),
  async (req, res) => {
    let uploadedImageUrl = null;

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
        !String(name).trim()
      ) {
        if (req.file) {
          const filePath =
            path.join(
              uploadDirectory,
              req.file.filename
            );

          if (
            fs.existsSync(
              filePath
            )
          ) {
            fs.unlinkSync(
              filePath
            );
          }
        }

        return res.status(400).json({
          success: false,
          message:
            "Member name is required.",
        });
      }

      if (req.file) {
        uploadedImageUrl =
          `/uploads/members/${req.file.filename}`;
      }

      const finalPhotoUrl =
        uploadedImageUrl ||
        (photo_url &&
        String(photo_url).trim()
          ? String(
              photo_url
            ).trim()
          : null);

      const finalJoinedDate =
        joined_date &&
        String(joined_date).trim()
          ? String(
              joined_date
            ).trim()
          : null;

      const finalIsActive =
        is_active !== undefined
          ? String(is_active) ===
            "true"
          : true;

      const finalDisplayOrder =
        Number.isInteger(
          Number(display_order)
        )
          ? Number(
              display_order
            )
          : 0;

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
            String(name).trim(),

            position &&
            String(position).trim()
              ? String(
                  position
                ).trim()
              : null,

            bio &&
            String(bio).trim()
              ? String(
                  bio
                ).trim()
              : null,

            finalPhotoUrl,

            phone &&
            String(phone).trim()
              ? String(
                  phone
                ).trim()
              : null,

            email &&
            String(email).trim()
              ? String(
                  email
                ).trim()
              : null,

            finalJoinedDate,

            finalIsActive,

            finalDisplayOrder,
          ]
        );

      res.status(201).json({
        success: true,
        message:
          "Member created successfully.",
        memberId:
          result.insertId,
        photoUrl:
          finalPhotoUrl,
      });
    } catch (error) {
      console.error(
        "CREATE MEMBER ERROR:",
        error
      );

      if (uploadedImageUrl) {
        deleteUploadedFile(
          uploadedImageUrl
        );
      }

      res.status(500).json({
        success: false,
        message:
          "Unable to create member.",
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
    let newUploadedImageUrl =
      null;

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
        existingMembers.length === 0
      ) {
        if (req.file) {
          const filePath =
            path.join(
              uploadDirectory,
              req.file.filename
            );

          if (
            fs.existsSync(
              filePath
            )
          ) {
            fs.unlinkSync(
              filePath
            );
          }
        }

        return res.status(404).json({
          success: false,
          message:
            "Member not found.",
        });
      }

      const oldPhotoUrl =
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
        !String(name).trim()
      ) {
        if (req.file) {
          const filePath =
            path.join(
              uploadDirectory,
              req.file.filename
            );

          if (
            fs.existsSync(
              filePath
            )
          ) {
            fs.unlinkSync(
              filePath
            );
          }
        }

        return res.status(400).json({
          success: false,
          message:
            "Member name is required.",
        });
      }

      if (req.file) {
        newUploadedImageUrl =
          `/uploads/members/${req.file.filename}`;
      }

      const finalPhotoUrl =
        newUploadedImageUrl ||
        (
          photo_url !==
          undefined
            ? (
                photo_url &&
                String(
                  photo_url
                ).trim()
              )
                ? String(
                    photo_url
                  ).trim()
                : null
            : oldPhotoUrl
        );

      const finalJoinedDate =
        joined_date &&
        String(joined_date).trim()
          ? String(
              joined_date
            ).trim()
          : null;

      const finalIsActive =
        is_active !== undefined
          ? String(is_active) ===
            "true"
          : true;

      const finalDisplayOrder =
        Number.isInteger(
          Number(display_order)
        )
          ? Number(
              display_order
            )
          : 0;

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
          String(name).trim(),

          position &&
          String(position).trim()
            ? String(
                position
              ).trim()
            : null,

          bio &&
          String(bio).trim()
            ? String(
                bio
              ).trim()
            : null,

          finalPhotoUrl,

          phone &&
          String(phone).trim()
            ? String(
                phone
              ).trim()
            : null,

          email &&
          String(email).trim()
            ? String(
                email
              ).trim()
            : null,

          finalJoinedDate,

          finalIsActive,

          finalDisplayOrder,

          memberId,
        ]
      );

      // Delete old physical image
      // only after successful DB update.
      if (
        newUploadedImageUrl &&
        oldPhotoUrl &&
        oldPhotoUrl !==
          newUploadedImageUrl
      ) {
        deleteUploadedFile(
          oldPhotoUrl
        );
      }

      res.json({
        success: true,
        message:
          "Member updated successfully.",
        photoUrl:
          finalPhotoUrl,
      });
    } catch (error) {
      console.error(
        "UPDATE MEMBER ERROR:",
        error
      );

      if (
        newUploadedImageUrl
      ) {
        deleteUploadedFile(
          newUploadedImageUrl
        );
      }

      res.status(500).json({
        success: false,
        message:
          "Unable to update member.",
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

      const photoUrl =
        members[0].photo_url;

      const [result] =
        await pool.execute(
          `
          DELETE FROM members
          WHERE id = ?
          `,
          [memberId]
        );

      if (
        result.affectedRows === 0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Member not found.",
        });
      }

      deleteUploadedFile(
        photoUrl
      );

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
            "Image must be smaller than 5 MB.",
        });
      }

      return res.status(400).json({
        success: false,
        message:
          error.message,
      });
    }

    if (error) {
      return res.status(400).json({
        success: false,
        message:
          error.message,
      });
    }

    next();
  }
);

/* =========================================================
   EXPORT
========================================================= */

module.exports = router;