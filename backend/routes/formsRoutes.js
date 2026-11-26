const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const { pool } = require("../config/db");
const { authenticateAdmin } = require("../middleware/authMiddleware");
const { FORMS_UPLOAD_DIR } = require("../config/uploadPaths");

const router = express.Router();

/* =========================================================
   UPLOAD DIRECTORY
========================================================= */

if (!fs.existsSync(FORMS_UPLOAD_DIR)) {
  fs.mkdirSync(FORMS_UPLOAD_DIR, {
    recursive: true,
  });
}

/* =========================================================
   MULTER STORAGE
========================================================= */

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, FORMS_UPLOAD_DIR);
  },

  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();

    const safeName = path
      .basename(file.originalname, extension)
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .replace(/-+/g, "-")
      .substring(0, 80);

    cb(
      null,
      `${Date.now()}-${safeName || "upload"}${extension}`
    );
  },
});

/* =========================================================
   FILE FILTER
========================================================= */

const allowedExtensions = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".pdf",
  ".doc",
  ".docx",
]);

const fileFilter = (req, file, cb) => {
  const extension = path
    .extname(file.originalname)
    .toLowerCase();

  if (!allowedExtensions.has(extension)) {
    return cb(
      new Error(
        "Unsupported file type. Allowed: JPG, JPEG, PNG, WEBP, GIF, PDF, DOC and DOCX."
      )
    );
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 10,
  },
});

/* =========================================================
   HELPERS
========================================================= */

const createSlug = (value) => {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 180);
};

const parseBoolean = (value, defaultValue = false) => {
  if (value === undefined || value === null) {
    return defaultValue;
  }

  if (typeof value === "boolean") {
    return value;
  }

  return (
    String(value).toLowerCase() === "true" ||
    String(value) === "1" ||
    String(value).toLowerCase() === "on"
  );
};

const getFileUrl = (req, filename) => {
  if (!filename) {
    return null;
  }

  return `${req.protocol}://${req.get("host")}/uploads/forms/${filename}`;
};

const safeDeleteFile = (fileUrl) => {
  if (!fileUrl) {
    return;
  }

  try {
    const filename = path.basename(fileUrl);
    const filePath = path.join(
      FORMS_UPLOAD_DIR,
      filename
    );

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error(
      "FORM FILE DELETE ERROR:",
      error
    );
  }
};

const getFormWithFields = async (formId) => {
  const [forms] = await pool.execute(
    `
      SELECT
        id,
        title,
        slug,
        description,
        button_text,
        is_active,
        is_published,
        image_url,
        created_at,
        updated_at
      FROM forms
      WHERE id = ?
      LIMIT 1
    `,
    [formId]
  );

  if (!forms.length) {
    return null;
  }

  const [fields] = await pool.execute(
    `
      SELECT
        id,
        form_id,
        field_name,
        field_label,
        field_type,
        placeholder,
        options,
        is_required,
        field_order,
        created_at
      FROM form_fields
      WHERE form_id = ?
      ORDER BY field_order ASC, id ASC
    `,
    [formId]
  );

  return {
    ...forms[0],
    is_active: Boolean(forms[0].is_active),
    is_published: Boolean(forms[0].is_published),
    fields: fields.map((field) => ({
      ...field,
      is_required: Boolean(field.is_required),
      options: field.options
        ? (() => {
            try {
              return JSON.parse(field.options);
            } catch {
              return field.options;
            }
          })()
        : [],
    })),
  };
};

/* =========================================================
   PUBLIC — GET ACTIVE + PUBLISHED FORMS
========================================================= */

router.get("/public", async (req, res) => {
  try {
    const [forms] = await pool.execute(
      `
        SELECT
          id,
          title,
          slug,
          description,
          button_text,
          is_active,
          is_published,
          image_url,
          created_at,
          updated_at
        FROM forms
        WHERE is_active = TRUE
          AND is_published = TRUE
        ORDER BY created_at DESC
      `
    );

    const result = [];

    for (const form of forms) {
      const [fields] = await pool.execute(
        `
          SELECT
            id,
            form_id,
            field_name,
            field_label,
            field_type,
            placeholder,
            options,
            is_required,
            field_order
          FROM form_fields
          WHERE form_id = ?
          ORDER BY field_order ASC, id ASC
        `,
        [form.id]
      );

      result.push({
        ...form,
        is_active: Boolean(form.is_active),
        is_published: Boolean(form.is_published),
        fields: fields.map((field) => ({
          ...field,
          is_required: Boolean(field.is_required),
          options: field.options
            ? (() => {
                try {
                  return JSON.parse(field.options);
                } catch {
                  return field.options;
                }
              })()
            : [],
        })),
      });
    }

    return res.json({
      success: true,
      forms: result,
    });
  } catch (error) {
    console.error(
      "GET PUBLIC FORMS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to load registration forms.",
    });
  }
});

/* =========================================================
   PUBLIC — GET ONE ACTIVE + PUBLISHED FORM
========================================================= */

router.get("/public/:slug", async (req, res) => {
  try {
    const [forms] = await pool.execute(
      `
        SELECT id
        FROM forms
        WHERE slug = ?
          AND is_active = TRUE
          AND is_published = TRUE
        LIMIT 1
      `,
      [req.params.slug]
    );

    if (!forms.length) {
      return res.status(404).json({
        success: false,
        message: "Registration form not found.",
      });
    }

    const form = await getFormWithFields(
      forms[0].id
    );

    return res.json({
      success: true,
      form,
    });
  } catch (error) {
    console.error(
      "GET PUBLIC FORM ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to load registration form.",
    });
  }
});

/* =========================================================
   PUBLIC — SUBMIT FORM
========================================================= */

router.post(
  "/public/:slug/submit",
  upload.any(),
  async (req, res) => {
    try {
      const [forms] = await pool.execute(
        `
          SELECT
            id,
            title,
            slug
          FROM forms
          WHERE slug = ?
            AND is_active = TRUE
            AND is_published = TRUE
          LIMIT 1
        `,
        [req.params.slug]
      );

      if (!forms.length) {
        return res.status(404).json({
          success: false,
          message:
            "This registration form is currently unavailable.",
        });
      }

      const form = forms[0];

      let submissionData = req.body.submission_data;

      if (!submissionData) {
        return res.status(400).json({
          success: false,
          message: "Submission data is required.",
        });
      }

      try {
        submissionData =
          typeof submissionData === "string"
            ? JSON.parse(submissionData)
            : submissionData;
      } catch {
        return res.status(400).json({
          success: false,
          message:
            "Invalid submission data format.",
        });
      }

      const [fields] = await pool.execute(
        `
          SELECT
            id,
            field_name,
            field_label,
            field_type,
            is_required
          FROM form_fields
          WHERE form_id = ?
          ORDER BY field_order ASC, id ASC
        `,
        [form.id]
      );

      /*
        Validate every required field on the server.
      */

      for (const field of fields) {
        if (!field.is_required) {
          continue;
        }

        const value =
          submissionData[field.field_name];

        const hasValue =
          value !== undefined &&
          value !== null &&
          String(value).trim() !== "";

        const hasFile =
          Array.isArray(req.files) &&
          req.files.some(
            (file) =>
              file.fieldname ===
              field.field_name
          );

        if (!hasValue && !hasFile) {
          return res.status(400).json({
            success: false,
            message: `${field.field_label} is required.`,
          });
        }
      }

      /*
        Store uploaded files inside submission data.
      */

      if (Array.isArray(req.files)) {
        for (const file of req.files) {
          const fileUrl = getFileUrl(
            req,
            file.filename
          );

          if (!submissionData[file.fieldname]) {
            submissionData[file.fieldname] =
              fileUrl;
          } else if (
            Array.isArray(
              submissionData[file.fieldname]
            )
          ) {
            submissionData[file.fieldname].push(
              fileUrl
            );
          } else {
            submissionData[file.fieldname] = [
              submissionData[file.fieldname],
              fileUrl,
            ];
          }
        }
      }

      const registrationId =
        `RUD-${Date.now()}-${Math.floor(
          1000 + Math.random() * 9000
        )}`;

      const [result] = await pool.execute(
        `
          INSERT INTO form_submissions (
            form_id,
            registration_id,
            submission_data,
            payment_status,
            status
          )
          VALUES (?, ?, ?, 'not_required', 'submitted')
        `,
        [
          form.id,
          registrationId,
          JSON.stringify(submissionData),
        ]
      );

      return res.status(201).json({
        success: true,
        message:
          "Registration submitted successfully.",
        submission_id: result.insertId,
        registration_id: registrationId,
        form: {
          id: form.id,
          title: form.title,
          slug: form.slug,
        },
      });
    } catch (error) {
      console.error(
        "FORM SUBMISSION ERROR:",
        error
      );

      if (Array.isArray(req.files)) {
        for (const file of req.files) {
          try {
            const filePath = path.join(
              FORMS_UPLOAD_DIR,
              file.filename
            );

            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          } catch (cleanupError) {
            console.error(
              "SUBMISSION FILE CLEANUP ERROR:",
              cleanupError
            );
          }
        }
      }

      return res.status(500).json({
        success: false,
        message:
          "Unable to submit registration.",
      });
    }
  }
);

/* =========================================================
   ADMIN — GET ALL FORMS
========================================================= */

router.get(
  "/",
  authenticateAdmin,
  async (req, res) => {
    try {
      const [forms] = await pool.execute(
        `
          SELECT
            id,
            title,
            slug,
            description,
            button_text,
            is_active,
            is_published,
            image_url,
            created_at,
            updated_at
          FROM forms
          ORDER BY created_at DESC
        `
      );

      const result = [];

      for (const form of forms) {
        const [fields] = await pool.execute(
          `
            SELECT
              id,
              form_id,
              field_name,
              field_label,
              field_type,
              placeholder,
              options,
              is_required,
              field_order,
              created_at
            FROM form_fields
            WHERE form_id = ?
            ORDER BY field_order ASC, id ASC
          `,
          [form.id]
        );

        result.push({
          ...form,
          is_active: Boolean(
            form.is_active
          ),
          is_published: Boolean(
            form.is_published
          ),
          fields: fields.map((field) => ({
            ...field,
            is_required: Boolean(
              field.is_required
            ),
            options: field.options
              ? (() => {
                  try {
                    return JSON.parse(
                      field.options
                    );
                  } catch {
                    return field.options;
                  }
                })()
              : [],
          })),
        });
      }

      return res.json({
        success: true,
        forms: result,
      });
    } catch (error) {
      console.error(
        "ADMIN GET FORMS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Unable to load forms.",
      });
    }
  }
);

/* =========================================================
   ADMIN — CREATE FORM
========================================================= */

router.post(
  "/",
  authenticateAdmin,
  upload.single("image"),
  async (req, res) => {
    try {
      const {
        title,
        slug,
        description,
        button_text,
        is_active,
        is_published,
      } = req.body;

      if (!title || !String(title).trim()) {
        return res.status(400).json({
          success: false,
          message: "Form title is required.",
        });
      }

      const finalSlug =
        createSlug(slug || title);

      if (!finalSlug) {
        return res.status(400).json({
          success: false,
          message: "A valid form slug is required.",
        });
      }

      const [existing] = await pool.execute(
        `
          SELECT id
          FROM forms
          WHERE slug = ?
          LIMIT 1
        `,
        [finalSlug]
      );

      if (existing.length) {
        return res.status(409).json({
          success: false,
          message:
            "A form with this slug already exists.",
        });
      }

      const imageUrl = req.file
        ? getFileUrl(req, req.file.filename)
        : null;

      const [result] = await pool.execute(
        `
          INSERT INTO forms (
            title,
            slug,
            description,
            button_text,
            is_active,
            is_published,
            image_url
          )
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [
          String(title).trim(),
          finalSlug,
          description || null,
          button_text ||
            "REGISTER NOW",
          parseBoolean(
            is_active,
            false
          ),
          parseBoolean(
            is_published,
            false
          ),
          imageUrl,
        ]
      );

      const form = await getFormWithFields(
        result.insertId
      );

      return res.status(201).json({
        success: true,
        message: "Form created successfully.",
        form,
      });
    } catch (error) {
      console.error(
        "ADMIN CREATE FORM ERROR:",
        error
      );

      if (req.file) {
        safeDeleteFile(
          getFileUrl(
            req,
            req.file.filename
          )
        );
      }

      return res.status(500).json({
        success: false,
        message: "Unable to create form.",
      });
    }
  }
);

/* =========================================================
   ADMIN — UPDATE FORM
========================================================= */

router.put(
  "/:id",
  authenticateAdmin,
  upload.single("image"),
  async (req, res) => {
    try {
      const formId = Number(req.params.id);

      if (!Number.isInteger(formId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid form ID.",
        });
      }

      const [existingRows] =
        await pool.execute(
          `
            SELECT *
            FROM forms
            WHERE id = ?
            LIMIT 1
          `,
          [formId]
        );

      if (!existingRows.length) {
        return res.status(404).json({
          success: false,
          message: "Form not found.",
        });
      }

      const existing =
        existingRows[0];

      const title =
        req.body.title !== undefined
          ? String(req.body.title).trim()
          : existing.title;

      const slug =
        req.body.slug !== undefined
          ? createSlug(req.body.slug)
          : existing.slug;

      if (!title || !slug) {
        return res.status(400).json({
          success: false,
          message:
            "Form title and slug are required.",
        });
      }

      const [duplicate] =
        await pool.execute(
          `
            SELECT id
            FROM forms
            WHERE slug = ?
              AND id <> ?
            LIMIT 1
          `,
          [slug, formId]
        );

      if (duplicate.length) {
        return res.status(409).json({
          success: false,
          message:
            "Another form already uses this slug.",
        });
      }

      let imageUrl =
        existing.image_url;

      if (req.file) {
        imageUrl = getFileUrl(
          req,
          req.file.filename
        );

        safeDeleteFile(
          existing.image_url
        );
      }

      await pool.execute(
        `
          UPDATE forms
          SET
            title = ?,
            slug = ?,
            description = ?,
            button_text = ?,
            is_active = ?,
            is_published = ?,
            image_url = ?
          WHERE id = ?
        `,
        [
          title,
          slug,
          req.body.description !==
          undefined
            ? req.body.description
            : existing.description,
          req.body.button_text !==
          undefined
            ? req.body.button_text
            : existing.button_text,
          req.body.is_active !==
          undefined
            ? parseBoolean(
                req.body.is_active
              )
            : Boolean(
                existing.is_active
              ),
          req.body.is_published !==
          undefined
            ? parseBoolean(
                req.body.is_published
              )
            : Boolean(
                existing.is_published
              ),
          imageUrl,
          formId,
        ]
      );

      const form = await getFormWithFields(
        formId
      );

      return res.json({
        success: true,
        message: "Form updated successfully.",
        form,
      });
    } catch (error) {
      console.error(
        "ADMIN UPDATE FORM ERROR:",
        error
      );

      if (req.file) {
        safeDeleteFile(
          getFileUrl(
            req,
            req.file.filename
          )
        );
      }

      return res.status(500).json({
        success: false,
        message: "Unable to update form.",
      });
    }
  }
);

/* =========================================================
   ADMIN — ON / OFF
========================================================= */

router.patch(
  "/:id/status",
  authenticateAdmin,
  async (req, res) => {
    try {
      const formId = Number(req.params.id);

      if (!Number.isInteger(formId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid form ID.",
        });
      }

      const isActive = parseBoolean(
        req.body.is_active
      );

      const [result] = await pool.execute(
        `
          UPDATE forms
          SET is_active = ?
          WHERE id = ?
        `,
        [isActive, formId]
      );

      if (!result.affectedRows) {
        return res.status(404).json({
          success: false,
          message: "Form not found.",
        });
      }

      return res.json({
        success: true,
        message: isActive
          ? "Form is now ON."
          : "Form is now OFF.",
        is_active: isActive,
      });
    } catch (error) {
      console.error(
        "FORM STATUS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to change form status.",
      });
    }
  }
);

/* =========================================================
   ADMIN — PUBLISH / UNPUBLISH
========================================================= */

router.patch(
  "/:id/publish",
  authenticateAdmin,
  async (req, res) => {
    try {
      const formId = Number(req.params.id);

      if (!Number.isInteger(formId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid form ID.",
        });
      }

      const isPublished = parseBoolean(
        req.body.is_published
      );

      const [result] = await pool.execute(
        `
          UPDATE forms
          SET is_published = ?
          WHERE id = ?
        `,
        [isPublished, formId]
      );

      if (!result.affectedRows) {
        return res.status(404).json({
          success: false,
          message: "Form not found.",
        });
      }

      return res.json({
        success: true,
        message: isPublished
          ? "Form published."
          : "Form moved to draft.",
        is_published: isPublished,
      });
    } catch (error) {
      console.error(
        "FORM PUBLISH ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to change publish status.",
      });
    }
  }
);

/* =========================================================
   ADMIN — DELETE FORM
========================================================= */

router.delete(
  "/:id",
  authenticateAdmin,
  async (req, res) => {
    try {
      const formId = Number(req.params.id);

      if (!Number.isInteger(formId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid form ID.",
        });
      }

      const [forms] = await pool.execute(
        `
          SELECT image_url
          FROM forms
          WHERE id = ?
          LIMIT 1
        `,
        [formId]
      );

      if (!forms.length) {
        return res.status(404).json({
          success: false,
          message: "Form not found.",
        });
      }

      await pool.execute(
        `
          DELETE FROM forms
          WHERE id = ?
        `,
        [formId]
      );

      safeDeleteFile(
        forms[0].image_url
      );

      return res.json({
        success: true,
        message: "Form deleted successfully.",
      });
    } catch (error) {
      console.error(
        "ADMIN DELETE FORM ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Unable to delete form.",
      });
    }
  }
);

/* =========================================================
   ADMIN — ADD FIELD
========================================================= */

router.post(
  "/:id/fields",
  authenticateAdmin,
  async (req, res) => {
    try {
      const formId = Number(req.params.id);

      if (!Number.isInteger(formId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid form ID.",
        });
      }

      const {
        field_name,
        field_label,
        field_type,
        placeholder,
        options,
        is_required,
        field_order,
      } = req.body;

      if (
        !field_name ||
        !String(field_name).trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Field name is required.",
        });
      }

      if (
        !field_label ||
        !String(field_label).trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Field label is required.",
        });
      }

      const [formRows] = await pool.execute(
        `
          SELECT id
          FROM forms
          WHERE id = ?
          LIMIT 1
        `,
        [formId]
      );

      if (!formRows.length) {
        return res.status(404).json({
          success: false,
          message: "Form not found.",
        });
      }

      let parsedOptions = options || [];

      if (typeof parsedOptions === "string") {
        try {
          parsedOptions =
            JSON.parse(parsedOptions);
        } catch {
          parsedOptions =
            parsedOptions
              .split(",")
              .map((item) =>
                item.trim()
              )
              .filter(Boolean);
        }
      }

      const [result] = await pool.execute(
        `
          INSERT INTO form_fields (
            form_id,
            field_name,
            field_label,
            field_type,
            placeholder,
            options,
            is_required,
            field_order
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          formId,
          String(field_name)
            .trim()
            .replace(/\s+/g, "_")
            .toLowerCase(),
          String(field_label).trim(),
          field_type || "text",
          placeholder || null,
          JSON.stringify(
            Array.isArray(parsedOptions)
              ? parsedOptions
              : []
          ),
          parseBoolean(
            is_required,
            true
          ),
          Number.isFinite(
            Number(field_order)
          )
            ? Number(field_order)
            : 0,
        ]
      );

      const [fields] = await pool.execute(
        `
          SELECT *
          FROM form_fields
          WHERE id = ?
          LIMIT 1
        `,
        [result.insertId]
      );

      return res.status(201).json({
        success: true,
        message:
          "Form field added successfully.",
        field: fields[0],
      });
    } catch (error) {
      console.error(
        "ADD FORM FIELD ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to add form field.",
      });
    }
  }
);

/* =========================================================
   ADMIN — UPDATE FIELD
========================================================= */

router.put(
  "/:id/fields/:fieldId",
  authenticateAdmin,
  async (req, res) => {
    try {
      const formId = Number(req.params.id);
      const fieldId = Number(
        req.params.fieldId
      );

      if (
        !Number.isInteger(formId) ||
        !Number.isInteger(fieldId)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid form or field ID.",
        });
      }

      const [existing] = await pool.execute(
        `
          SELECT *
          FROM form_fields
          WHERE id = ?
            AND form_id = ?
          LIMIT 1
        `,
        [fieldId, formId]
      );

      if (!existing.length) {
        return res.status(404).json({
          success: false,
          message: "Form field not found.",
        });
      }

      const current = existing[0];

      let options =
        req.body.options !== undefined
          ? req.body.options
          : current.options;

      if (typeof options === "string") {
        try {
          options = JSON.parse(options);
        } catch {
          options = options
            .split(",")
            .map((item) =>
              item.trim()
            )
            .filter(Boolean);
        }
      }

      await pool.execute(
        `
          UPDATE form_fields
          SET
            field_name = ?,
            field_label = ?,
            field_type = ?,
            placeholder = ?,
            options = ?,
            is_required = ?,
            field_order = ?
          WHERE id = ?
            AND form_id = ?
        `,
        [
          req.body.field_name !==
          undefined
            ? String(
                req.body.field_name
              )
                .trim()
                .replace(
                  /\s+/g,
                  "_"
                )
                .toLowerCase()
            : current.field_name,

          req.body.field_label !==
          undefined
            ? String(
                req.body.field_label
              ).trim()
            : current.field_label,

          req.body.field_type !==
          undefined
            ? req.body.field_type
            : current.field_type,

          req.body.placeholder !==
          undefined
            ? req.body.placeholder
            : current.placeholder,

          JSON.stringify(
            Array.isArray(options)
              ? options
              : []
          ),

          req.body.is_required !==
          undefined
            ? parseBoolean(
                req.body.is_required
              )
            : Boolean(
                current.is_required
              ),

          req.body.field_order !==
          undefined
            ? Number(
                req.body.field_order
              )
            : current.field_order,

          fieldId,
          formId,
        ]
      );

      return res.json({
        success: true,
        message:
          "Form field updated successfully.",
      });
    } catch (error) {
      console.error(
        "UPDATE FORM FIELD ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to update form field.",
      });
    }
  }
);

/* =========================================================
   ADMIN — DELETE FIELD
========================================================= */

router.delete(
  "/:id/fields/:fieldId",
  authenticateAdmin,
  async (req, res) => {
    try {
      const formId = Number(req.params.id);
      const fieldId = Number(
        req.params.fieldId
      );

      if (
        !Number.isInteger(formId) ||
        !Number.isInteger(fieldId)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid form or field ID.",
        });
      }

      const [result] = await pool.execute(
        `
          DELETE FROM form_fields
          WHERE id = ?
            AND form_id = ?
        `,
        [fieldId, formId]
      );

      if (!result.affectedRows) {
        return res.status(404).json({
          success: false,
          message: "Form field not found.",
        });
      }

      return res.json({
        success: true,
        message:
          "Form field deleted successfully.",
      });
    } catch (error) {
      console.error(
        "DELETE FORM FIELD ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to delete form field.",
      });
    }
  }
);

/* =========================================================
   ADMIN — GET SUBMISSIONS
========================================================= */

router.get(
  "/:id/submissions",
  authenticateAdmin,
  async (req, res) => {
    try {
      const formId = Number(req.params.id);

      if (!Number.isInteger(formId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid form ID.",
        });
      }

      const [submissions] =
        await pool.execute(
          `
            SELECT
              id,
              form_id,
              registration_id,
              submission_data,
              payment_status,
              payment_id,
              status,
              submitted_at,
              updated_at
            FROM form_submissions
            WHERE form_id = ?
            ORDER BY submitted_at DESC
          `,
          [formId]
        );

      const result =
        submissions.map(
          (submission) => ({
            ...submission,
            submission_data:
              (() => {
                try {
                  return JSON.parse(
                    submission.submission_data
                  );
                } catch {
                  return {};
                }
              })(),
          })
        );

      return res.json({
        success: true,
        submissions: result,
      });
    } catch (error) {
      console.error(
        "GET FORM SUBMISSIONS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load submissions.",
      });
    }
  }
);

module.exports = router;