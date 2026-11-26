const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const { pool } = require("../config/db");

const {
  authenticateAdmin,
} = require("../middleware/authMiddleware");

const {
  EVENTS_UPLOAD_DIR,
} = require("../config/uploadPaths");

const router = express.Router();

/* =========================================================
   UPLOAD DIRECTORY
========================================================= */

const uploadDirectory =
  EVENTS_UPLOAD_DIR;

if (
  !fs.existsSync(
    uploadDirectory
  )
) {
  fs.mkdirSync(
    uploadDirectory,
    {
      recursive: true,
    }
  );
}

/* =========================================================
   MULTER STORAGE
========================================================= */

const storage =
  multer.diskStorage({
    destination: (
      req,
      file,
      cb
    ) => {
      cb(
        null,
        uploadDirectory
      );
    },

    filename: (
      req,
      file,
      cb
    ) => {
      const extension =
        path
          .extname(
            file.originalname
          )
          .toLowerCase();

      const baseName =
        path
          .basename(
            file.originalname,
            extension
          )
          .replace(
            /[^a-zA-Z0-9-_]/g,
            "-"
          )
          .replace(
            /-+/g,
            "-"
          )
          .replace(
            /^-|-$/g,
            ""
          )
          .toLowerCase()
          .slice(
            0,
            60
          );

      const finalBaseName =
        baseName || "event";

      const uniqueName =
        `${finalBaseName}-${Date.now()}-${Math.round(
          Math.random() * 1e9
        )}${extension}`;

      cb(
        null,
        uniqueName
      );
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
    !allowedTypes.includes(
      file.mimetype
    )
  ) {
    return cb(
      new Error(
        "Only JPG, PNG and WEBP images are allowed."
      )
    );
  }

  cb(
    null,
    true
  );
};

/* =========================================================
   MULTER
========================================================= */

const upload =
  multer({
    storage,
    fileFilter,
    limits: {
      fileSize:
        5 * 1024 * 1024,
    },
  });

/* =========================================================
   HELPERS
========================================================= */

const deleteUploadedFile = (
  imageUrl
) => {
  if (!imageUrl) {
    return;
  }

  if (
    !imageUrl.startsWith(
      "/uploads/events/"
    )
  ) {
    return;
  }

  const filename =
    path.basename(
      imageUrl
    );

  if (!filename) {
    return;
  }

  const filePath =
    path.join(
      uploadDirectory,
      filename
    );

  try {
    if (
      fs.existsSync(
        filePath
      )
    ) {
      fs.unlinkSync(
        filePath
      );
    }
  } catch (error) {
    console.error(
      "DELETE EVENT IMAGE ERROR:",
      error
    );
  }
};

const getUploadedImageUrl = (
  req
) => {
  if (!req.file) {
    return null;
  }

  return `/uploads/events/${req.file.filename}`;
};

const toBoolean = (
  value,
  fallback = false
) => {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return fallback;
  }

  if (
    typeof value ===
    "boolean"
  ) {
    return value;
  }

  return (
    value === true ||
    value === 1 ||
    value === "1" ||
    String(value)
      .toLowerCase() ===
      "true"
  );
};

const toInteger = (
  value,
  fallback = 0
) => {
  const number =
    Number(value);

  return Number.isInteger(
    number
  )
    ? number
    : fallback;
};

/* =========================================================
   GET ALL PUBLISHED EVENTS
   GET /api/events
========================================================= */

router.get(
  "/",
  async (
    req,
    res
  ) => {
    try {
      const [
        events,
      ] =
        await pool.execute(`
          SELECT
            id,
            title,
            slug,
            description,
            event_date,
            event_time,
            location,
            cover_image,
            status,
            is_featured,
            is_published,
            display_order,
            created_at,
            updated_at
          FROM events
          WHERE is_published = TRUE
          ORDER BY
            event_date DESC,
            display_order ASC,
            id DESC
        `);

      return res.json({
        success: true,
        count:
          events.length,
        events,
      });
    } catch (error) {
      console.error(
        "GET EVENTS ERROR:",
        error
      );

      return res.status(
        500
      ).json({
        success: false,
        message:
          "Unable to fetch events.",
      });
    }
  }
);

/* =========================================================
   GET EVENT BY ID
   GET /api/events/:id
========================================================= */

router.get(
  "/:id",
  async (
    req,
    res
  ) => {
    try {
      const eventId =
        Number(
          req.params.id
        );

      if (
        !Number.isInteger(
          eventId
        ) ||
        eventId <= 0
      ) {
        return res.status(
          400
        ).json({
          success: false,
          message:
            "Invalid event ID.",
        });
      }

      const [
        events,
      ] =
        await pool.execute(
          `
          SELECT
            id,
            title,
            slug,
            description,
            event_date,
            event_time,
            location,
            cover_image,
            status,
            is_featured,
            is_published,
            display_order,
            created_at,
            updated_at
          FROM events
          WHERE id = ?
          LIMIT 1
          `,
          [
            eventId,
          ]
        );

      if (
        events.length ===
        0
      ) {
        return res.status(
          404
        ).json({
          success: false,
          message:
            "Event not found.",
        });
      }

      return res.json({
        success: true,
        event:
          events[0],
      });
    } catch (error) {
      console.error(
        "GET EVENT ERROR:",
        error
      );

      return res.status(
        500
      ).json({
        success: false,
        message:
          "Unable to fetch event.",
      });
    }
  }
);

/* =========================================================
   CREATE EVENT
   POST /api/events
========================================================= */

router.post(
  "/",
  authenticateAdmin,
  upload.single(
    "image"
  ),
  async (
    req,
    res
  ) => {
    const uploadedImageUrl =
      getUploadedImageUrl(
        req
      );

    try {
      const {
        title,
        slug,
        description,
        event_date,
        event_time,
        location,
        cover_image,
        status,
        is_featured,
        is_published,
        display_order,
      } = req.body || {};

      /* -----------------------------------------------------
         VALIDATION
      ----------------------------------------------------- */

      if (
        !title ||
        !String(title).trim()
      ) {
        deleteUploadedFile(
          uploadedImageUrl
        );

        return res.status(
          400
        ).json({
          success: false,
          message:
            "Event title is required.",
        });
      }

      if (
        !slug ||
        !String(slug).trim()
      ) {
        deleteUploadedFile(
          uploadedImageUrl
        );

        return res.status(
          400
        ).json({
          success: false,
          message:
            "Event slug is required.",
        });
      }

      if (
        !event_date
      ) {
        deleteUploadedFile(
          uploadedImageUrl
        );

        return res.status(
          400
        ).json({
          success: false,
          message:
            "Event date is required.",
        });
      }

      /* -----------------------------------------------------
         STATUS
      ----------------------------------------------------- */

      const eventStatus = [
        "upcoming",
        "ongoing",
        "completed",
      ].includes(
        status
      )
        ? status
        : "upcoming";

      /* -----------------------------------------------------
         IMAGE
      ----------------------------------------------------- */

      const finalCoverImage =
        uploadedImageUrl ||
        (
          cover_image &&
          String(
            cover_image
          ).trim()
        )
          ? uploadedImageUrl ||
            String(
              cover_image
            ).trim()
          : null;

      /* -----------------------------------------------------
         INSERT
      ----------------------------------------------------- */

      const [
        result,
      ] =
        await pool.execute(
          `
          INSERT INTO events
          (
            title,
            slug,
            description,
            event_date,
            event_time,
            location,
            cover_image,
            status,
            is_featured,
            is_published,
            display_order
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            String(
              title
            ).trim(),

            String(
              slug
            ).trim(),

            description &&
            String(
              description
            ).trim()
              ? String(
                  description
                ).trim()
              : null,

            event_date,

            event_time &&
            String(
              event_time
            ).trim()
              ? String(
                  event_time
                ).trim()
              : null,

            location &&
            String(
              location
            ).trim()
              ? String(
                  location
                ).trim()
              : null,

            finalCoverImage,

            eventStatus,

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

      return res.status(
        201
      ).json({
        success: true,

        message:
          "Event created successfully.",

        eventId:
          result.insertId,

        cover_image:
          finalCoverImage,
      });
    } catch (error) {
      console.error(
        "CREATE EVENT ERROR:",
        error
      );

      deleteUploadedFile(
        uploadedImageUrl
      );

      if (
        error.code ===
        "ER_DUP_ENTRY"
      ) {
        return res.status(
          409
        ).json({
          success: false,
          message:
            "An event with this slug already exists.",
        });
      }

      return res.status(
        500
      ).json({
        success: false,
        message:
          "Unable to create event.",
      });
    }
  }
);

/* =========================================================
   UPDATE EVENT
   PUT /api/events/:id
========================================================= */

router.put(
  "/:id",
  authenticateAdmin,
  upload.single(
    "image"
  ),
  async (
    req,
    res
  ) => {
    const uploadedImageUrl =
      getUploadedImageUrl(
        req
      );

    try {
      const eventId =
        Number(
          req.params.id
        );

      if (
        !Number.isInteger(
          eventId
        ) ||
        eventId <= 0
      ) {
        deleteUploadedFile(
          uploadedImageUrl
        );

        return res.status(
          400
        ).json({
          success: false,
          message:
            "Invalid event ID.",
        });
      }

      /* -----------------------------------------------------
         EXISTING EVENT
      ----------------------------------------------------- */

      const [
        existingEvents,
      ] =
        await pool.execute(
          `
          SELECT
            id,
            cover_image
          FROM events
          WHERE id = ?
          LIMIT 1
          `,
          [
            eventId,
          ]
        );

      if (
        existingEvents.length ===
        0
      ) {
        deleteUploadedFile(
          uploadedImageUrl
        );

        return res.status(
          404
        ).json({
          success: false,
          message:
            "Event not found.",
        });
      }

      const oldCoverImage =
        existingEvents[0]
          .cover_image;

      /* -----------------------------------------------------
         REQUEST DATA
      ----------------------------------------------------- */

      const {
        title,
        slug,
        description,
        event_date,
        event_time,
        location,
        cover_image,
        status,
        is_featured,
        is_published,
        display_order,
      } = req.body || {};

      /* -----------------------------------------------------
         VALIDATION
      ----------------------------------------------------- */

      if (
        !title ||
        !String(title).trim()
      ) {
        deleteUploadedFile(
          uploadedImageUrl
        );

        return res.status(
          400
        ).json({
          success: false,
          message:
            "Event title is required.",
        });
      }

      if (
        !slug ||
        !String(slug).trim()
      ) {
        deleteUploadedFile(
          uploadedImageUrl
        );

        return res.status(
          400
        ).json({
          success: false,
          message:
            "Event slug is required.",
        });
      }

      if (
        !event_date
      ) {
        deleteUploadedFile(
          uploadedImageUrl
        );

        return res.status(
          400
        ).json({
          success: false,
          message:
            "Event date is required.",
        });
      }

      /* -----------------------------------------------------
         STATUS
      ----------------------------------------------------- */

      const eventStatus = [
        "upcoming",
        "ongoing",
        "completed",
      ].includes(
        status
      )
        ? status
        : "upcoming";

      /* -----------------------------------------------------
         IMAGE
      ----------------------------------------------------- */

      let finalCoverImage;

      if (
        uploadedImageUrl
      ) {
        finalCoverImage =
          uploadedImageUrl;
      } else if (
        cover_image !==
        undefined
      ) {
        finalCoverImage =
          cover_image &&
          String(
            cover_image
          ).trim()
            ? String(
                cover_image
              ).trim()
            : null;
      } else {
        finalCoverImage =
          oldCoverImage ||
          null;
      }

      /* -----------------------------------------------------
         UPDATE DATABASE
      ----------------------------------------------------- */

      const [
        result,
      ] =
        await pool.execute(
          `
          UPDATE events
          SET
            title = ?,
            slug = ?,
            description = ?,
            event_date = ?,
            event_time = ?,
            location = ?,
            cover_image = ?,
            status = ?,
            is_featured = ?,
            is_published = ?,
            display_order = ?
          WHERE id = ?
          `,
          [
            String(
              title
            ).trim(),

            String(
              slug
            ).trim(),

            description &&
            String(
              description
            ).trim()
              ? String(
                  description
                ).trim()
              : null,

            event_date,

            event_time &&
            String(
              event_time
            ).trim()
              ? String(
                  event_time
                ).trim()
              : null,

            location &&
            String(
              location
            ).trim()
              ? String(
                  location
                ).trim()
              : null,

            finalCoverImage,

            eventStatus,

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

            eventId,
          ]
        );

      if (
        result.affectedRows ===
        0
      ) {
        deleteUploadedFile(
          uploadedImageUrl
        );

        return res.status(
          404
        ).json({
          success: false,
          message:
            "Event not found.",
        });
      }

      /* -----------------------------------------------------
         DELETE OLD IMAGE
      ----------------------------------------------------- */

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

      return res.json({
        success: true,

        message:
          "Event updated successfully.",

        cover_image:
          finalCoverImage,
      });
    } catch (error) {
      console.error(
        "UPDATE EVENT ERROR:",
        error
      );

      deleteUploadedFile(
        uploadedImageUrl
      );

      if (
        error.code ===
        "ER_DUP_ENTRY"
      ) {
        return res.status(
          409
        ).json({
          success: false,
          message:
            "An event with this slug already exists.",
        });
      }

      return res.status(
        500
      ).json({
        success: false,
        message:
          "Unable to update event.",
      });
    }
  }
);

/* =========================================================
   DELETE EVENT
   DELETE /api/events/:id
========================================================= */

router.delete(
  "/:id",
  authenticateAdmin,
  async (
    req,
    res
  ) => {
    try {
      const eventId =
        Number(
          req.params.id
        );

      if (
        !Number.isInteger(
          eventId
        ) ||
        eventId <= 0
      ) {
        return res.status(
          400
        ).json({
          success: false,
          message:
            "Invalid event ID.",
        });
      }

      /* -----------------------------------------------------
         GET IMAGE BEFORE DELETE
      ----------------------------------------------------- */

      const [
        events,
      ] =
        await pool.execute(
          `
          SELECT
            cover_image
          FROM events
          WHERE id = ?
          LIMIT 1
          `,
          [
            eventId,
          ]
        );

      if (
        events.length ===
        0
      ) {
        return res.status(
          404
        ).json({
          success: false,
          message:
            "Event not found.",
        });
      }

      const oldCoverImage =
        events[0]
          .cover_image;

      /* -----------------------------------------------------
         DELETE DATABASE RECORD
      ----------------------------------------------------- */

      const [
        result,
      ] =
        await pool.execute(
          `
          DELETE FROM events
          WHERE id = ?
          `,
          [
            eventId,
          ]
        );

      if (
        result.affectedRows ===
        0
      ) {
        return res.status(
          404
        ).json({
          success: false,
          message:
            "Event not found.",
        });
      }

      /* -----------------------------------------------------
         DELETE IMAGE
      ----------------------------------------------------- */

      deleteUploadedFile(
        oldCoverImage
      );

      return res.json({
        success: true,
        message:
          "Event deleted successfully.",
      });
    } catch (error) {
      console.error(
        "DELETE EVENT ERROR:",
        error
      );

      return res.status(
        500
      ).json({
        success: false,
        message:
          "Unable to delete event.",
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
        return res.status(
          400
        ).json({
          success: false,
          message:
            "Image must be smaller than 5MB.",
        });
      }

      return res.status(
        400
      ).json({
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
      return res.status(
        400
      ).json({
        success: false,
        message:
          error.message,
      });
    }

    next(error);
  }
);

/* =========================================================
   EXPORT
========================================================= */

module.exports =
  router;