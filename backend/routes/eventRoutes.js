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
  "../uploads/events"
);

if (!fs.existsSync(uploadDirectory)) {
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
        path.extname(
          file.originalname
        ).toLowerCase();

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
          .toLowerCase();

      const uniqueName =
        `${Date.now()}-${Math.round(
          Math.random() * 1e9
        )}-${baseName || "event"}${extension}`;

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
    allowedTypes.includes(
      file.mimetype
    )
  ) {
    cb(
      null,
      true
    );
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
   HELPER — DELETE FILE
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

      const [events] =
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


      res.json({
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

      res.status(500).json({
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

        return res.status(400).json({
          success: false,
          message:
            "Invalid event ID.",
        });

      }


      const [events] =
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
            is_published,
            display_order,
            created_at,
            updated_at
          FROM events
          WHERE id = ?
          LIMIT 1
          `,
          [eventId]
        );


      if (
        events.length === 0
      ) {

        return res.status(404).json({
          success: false,
          message:
            "Event not found.",
        });

      }


      res.json({
        success: true,
        event:
          events[0],
      });

    } catch (error) {

      console.error(
        "GET EVENT ERROR:",
        error
      );

      res.status(500).json({
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
  upload.single("image"),
  async (
    req,
    res
  ) => {

    let uploadedImage = null;

    try {

      /*
        Multer parses multipart/form-data,
        so req.body will now contain
        the event fields.
      */

      const {
        title,
        slug,
        description,
        event_date,
        event_time,
        location,
        cover_image,
        status,
        is_published,
        display_order,
      } = req.body || {};


      if (
        !title ||
        !title.trim()
      ) {

        return res.status(400).json({
          success: false,
          message:
            "Event title is required.",
        });

      }


      if (
        !slug ||
        !slug.trim()
      ) {

        return res.status(400).json({
          success: false,
          message:
            "Event slug is required.",
        });

      }


      if (!event_date) {

        return res.status(400).json({
          success: false,
          message:
            "Event date is required.",
        });

      }


      const eventStatus =
        [
          "upcoming",
          "ongoing",
          "completed",
        ].includes(status)
          ? status
          : "upcoming";


      /*
        If an image was uploaded,
        create the public URL.
      */

      if (req.file) {

        uploadedImage =
          `/uploads/events/${req.file.filename}`;

      }


      const finalImage =
        uploadedImage ||
        cover_image ||
        null;


      const [result] =
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
            is_published,
            display_order
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            title.trim(),

            slug.trim(),

            description
              ? description.trim()
              : null,

            event_date,

            event_time ||
              null,

            location
              ? location.trim()
              : null,

            finalImage,

            eventStatus,

            is_published !==
            undefined
              ? String(
                  is_published
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
          "Event created successfully.",

        eventId:
          result.insertId,

        imageUrl:
          finalImage,
      });

    } catch (error) {

      console.error(
        "CREATE EVENT ERROR:",
        error
      );


      if (
        uploadedImage
      ) {
        deleteUploadedFile(
          uploadedImage
        );
      }


      if (
        error.code ===
        "ER_DUP_ENTRY"
      ) {

        return res.status(409).json({
          success: false,
          message:
            "An event with this slug already exists.",
        });

      }


      res.status(500).json({
        success: false,
        message:
          "Unable to create event.",
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
   UPDATE EVENT
   PUT /api/events/:id
========================================================= */

router.put(
  "/:id",
  authenticateAdmin,
  upload.single("image"),
  async (
    req,
    res
  ) => {

    let uploadedImage = null;

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

        return res.status(400).json({
          success: false,
          message:
            "Invalid event ID.",
        });

      }


      const [existingEvents] =
        await pool.execute(
          `
          SELECT
            id,
            cover_image
          FROM events
          WHERE id = ?
          LIMIT 1
          `,
          [eventId]
        );


      if (
        existingEvents.length ===
        0
      ) {

        return res.status(404).json({
          success: false,
          message:
            "Event not found.",
        });

      }


      const oldImage =
        existingEvents[0]
          .cover_image;


      const {
        title,
        slug,
        description,
        event_date,
        event_time,
        location,
        cover_image,
        status,
        is_published,
        display_order,
      } = req.body || {};


      if (
        !title ||
        !title.trim()
      ) {

        return res.status(400).json({
          success: false,
          message:
            "Event title is required.",
        });

      }


      if (
        !slug ||
        !slug.trim()
      ) {

        return res.status(400).json({
          success: false,
          message:
            "Event slug is required.",
        });

      }


      if (!event_date) {

        return res.status(400).json({
          success: false,
          message:
            "Event date is required.",
        });

      }


      const eventStatus =
        [
          "upcoming",
          "ongoing",
          "completed",
        ].includes(status)
          ? status
          : "upcoming";


      /*
        New uploaded image
      */

      if (req.file) {

        uploadedImage =
          `/uploads/events/${req.file.filename}`;

      }


      /*
        Priority:

        1. New uploaded image
        2. Existing image from form
        3. Old database image
      */

      const finalImage =
        uploadedImage ||
        cover_image ||
        oldImage ||
        null;


      const [result] =
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
            is_published = ?,
            display_order = ?
          WHERE id = ?
          `,
          [
            title.trim(),

            slug.trim(),

            description
              ? description.trim()
              : null,

            event_date,

            event_time ||
              null,

            location
              ? location.trim()
              : null,

            finalImage,

            eventStatus,

            is_published !==
            undefined
              ? String(
                  is_published
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

            eventId,
          ]
        );


      if (
        result.affectedRows === 0
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
            "Event not found.",
        });

      }


      /*
        Delete the old physical image
        only after successful replacement.
      */

      if (
        uploadedImage &&
        oldImage &&
        oldImage !== uploadedImage
      ) {

        deleteUploadedFile(
          oldImage
        );

      }


      res.json({
        success: true,

        message:
          "Event updated successfully.",

        imageUrl:
          finalImage,
      });

    } catch (error) {

      console.error(
        "UPDATE EVENT ERROR:",
        error
      );


      if (
        uploadedImage
      ) {
        deleteUploadedFile(
          uploadedImage
        );
      }


      if (
        error.code ===
        "ER_DUP_ENTRY"
      ) {

        return res.status(409).json({
          success: false,
          message:
            "An event with this slug already exists.",
        });

      }


      res.status(500).json({
        success: false,
        message:
          "Unable to update event.",
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

        return res.status(400).json({
          success: false,
          message:
            "Invalid event ID.",
        });

      }


      const [events] =
        await pool.execute(
          `
          SELECT
            cover_image
          FROM events
          WHERE id = ?
          LIMIT 1
          `,
          [eventId]
        );


      if (
        events.length === 0
      ) {

        return res.status(404).json({
          success: false,
          message:
            "Event not found.",
        });

      }


      const imageToDelete =
        events[0]
          .cover_image;


      const [result] =
        await pool.execute(
          `
          DELETE FROM events
          WHERE id = ?
          `,
          [eventId]
        );


      if (
        result.affectedRows === 0
      ) {

        return res.status(404).json({
          success: false,
          message:
            "Event not found.",
        });

      }


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
          "Event deleted successfully.",
      });

    } catch (error) {

      console.error(
        "DELETE EVENT ERROR:",
        error
      );

      res.status(500).json({
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