
const express = require("express");
const crypto = require("crypto");
const { pool } = require("../db");
const { verifyAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

// ========================================
// GENERATE UNIQUE SLUG
// ========================================

function makeSlug(value) {
  const base = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return `${base || "registration"}-${crypto.randomBytes(4).toString("hex")}`;
}

// ========================================
// PARSE CATEGORY OPTIONS
// Supports JSON strings, buffers and arrays.
// ========================================

function parseOptions(value, fieldId) {
  if (Buffer.isBuffer(value)) {
    value = value.toString("utf8");
  }

  // Already parsed by the database driver
  if (Array.isArray(value)) {
    return value;
  }

  if (value && typeof value === "object") {
    return Array.isArray(value) ? value : [];
  }

  if (typeof value !== "string" || !value.trim()) {
    console.warn(`Category ${fieldId}: options are empty.`);
    return [];
  }

  let parsed = value;

  // Allow for JSON accidentally encoded as a JSON string.
  for (let attempt = 0; attempt < 2; attempt++) {
    if (Array.isArray(parsed)) {
      return parsed;
    }

    if (typeof parsed !== "string") {
      break;
    }

    try {
      parsed = JSON.parse(parsed);
    } catch (error) {
      console.error(
        `Category ${fieldId}: JSON parsing failed:`,
        error.message
      );
      return [];
    }
  }

  if (Array.isArray(parsed)) {
    return parsed;
  }

  console.error(
    `Category ${fieldId}: parsed options are not an array.`
  );

  return [];
}

// ========================================
// VALIDATE FORM DATA
// ========================================

function validateForm(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return "Invalid form data.";
  }

  if (
    typeof body.title !== "string" ||
    !body.title.trim() ||
    body.title.trim().length > 200
  ) {
    return "A valid form title is required (maximum 200 characters).";
  }

  if (
    typeof body.eventTitle !== "string" ||
    !body.eventTitle.trim() ||
    body.eventTitle.trim().length > 200
  ) {
    return "A valid event title is required (maximum 200 characters).";
  }

  if (
    body.description !== undefined &&
    typeof body.description !== "string"
  ) {
    return "Description must be text.";
  }

  if (
    body.fee !== undefined &&
    (!Number.isFinite(Number(body.fee)) || Number(body.fee) < 0)
  ) {
    return "Registration fee must be zero or greater.";
  }

  if (!Array.isArray(body.categories)) {
    return "Categories must be an array.";
  }

  return null;
}

// ========================================
// PUBLIC: GET ALL PUBLISHED FORMS
// Includes closed forms.
// ========================================

router.get("/public", async (req, res) => {
  try {
    const [forms] = await pool.execute(
      `SELECT
        f.id,
        f.title,
        f.slug,
        f.description,
        f.fee,
        f.is_active,
        e.title AS event_title,
        e.registration_end,
        CASE
          WHEN f.is_active = 1
            AND (
              e.registration_end IS NULL
              OR e.registration_end >= NOW()
            )
          THEN 1
          ELSE 0
        END AS registration_open
      FROM forms f
      INNER JOIN events e ON e.id = f.event_id
      WHERE e.status = 'published'
      ORDER BY f.created_at DESC`
    );

    return res.json({
      success: true,
      forms,
    });
  } catch (error) {
    console.error("Public forms error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to load registration forms.",
    });
  }
});

// ========================================
// PUBLIC: GET ONE PUBLISHED FORM BY SLUG
// Closed forms remain accessible.
// ========================================

router.get("/public/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    const [forms] = await pool.execute(
      `SELECT
        f.id,
        f.title,
        f.slug,
        f.description,
        f.fee,
        f.is_active,
        e.title AS event_title,
        e.registration_end,
        CASE
          WHEN f.is_active = 1
            AND (
              e.registration_end IS NULL
              OR e.registration_end >= NOW()
            )
          THEN 1
          ELSE 0
        END AS registration_open
      FROM forms f
      INNER JOIN events e ON e.id = f.event_id
      WHERE f.slug = ?
        AND e.status = 'published'
      LIMIT 1`,
      [slug]
    );

    if (!forms.length) {
      return res.status(404).json({
        success: false,
        message: "Registration form not found.",
      });
    }

    const form = forms[0];

    const [fields] = await pool.execute(
      `SELECT
        id,
        field_key,
        label,
        field_type,
        options,
        is_required,
        sort_order
      FROM form_fields
      WHERE form_id = ?
      ORDER BY sort_order ASC`,
      [form.id]
    );

    console.log(
      `Loading registration form ${form.id}. Found ${fields.length} fields.`
    );

    const categories = fields.map((field) => {
      const options = parseOptions(field.options, field.id);

      console.log(
        `Category "${field.label}" (ID ${field.id}): ${options.length} options`
      );

      return {
        id: field.id,
        name: field.label,
        fieldKey: field.field_key,
        type: field.field_type,
        required: Boolean(field.is_required),
        options,
      };
    });

    return res.json({
      success: true,
      form: {
        ...form,
        categories,
      },
    });
  } catch (error) {
    console.error("Public form details error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to load registration form details.",
    });
  }
});

// ========================================
// ADMIN: CREATE REGISTRATION FORM
// ========================================

router.post("/", verifyAdmin, async (req, res) => {
  const errorMessage = validateForm(req.body);

  if (errorMessage) {
    return res.status(400).json({
      success: false,
      message: errorMessage,
    });
  }

  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const {
      title,
      eventTitle,
      description = "",
      fee = 0,
      deadline = null,
      categories,
      theme = "ivory",
    } = req.body;

    const eventSlug = makeSlug(eventTitle);
    const formSlug = makeSlug(title);

    const [eventResult] = await connection.execute(
      `INSERT INTO events
       (title, slug, description, registration_end, status)
       VALUES (?, ?, ?, ?, 'draft')`,
      [
        eventTitle.trim(),
        eventSlug,
        description,
        deadline || null,
      ]
    );

    const eventId = eventResult.insertId;

    const [formResult] = await connection.execute(
      `INSERT INTO forms
       (event_id, title, slug, description, fee, is_active)
       VALUES (?, ?, ?, ?, ?, 0)`,
      [
        eventId,
        title.trim(),
        formSlug,
        description,
        Number(fee),
      ]
    );

    const formId = formResult.insertId;

    for (let index = 0; index < categories.length; index++) {
      const category = categories[index];

      if (
        !category ||
        typeof category.name !== "string" ||
        !category.name.trim() ||
        !Array.isArray(category.options)
      ) {
        throw new Error(`Invalid category at position ${index + 1}.`);
      }

      const fieldKey = `category_${index + 1}`;

      await connection.execute(
        `INSERT INTO form_fields
         (form_id, field_key, label, field_type, options, is_required, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          formId,
          fieldKey,
          category.name.trim(),
          "category",
          JSON.stringify(category.options),
          1,
          index + 1,
        ]
      );
    }

    const settings = [
      [`form_${formId}_theme`, theme],
      [
        `form_${formId}_instructions`,
        req.body.instructions || "",
      ],
    ];

    for (const [settingKey, settingValue] of settings) {
      await connection.execute(
        `INSERT INTO site_settings
         (setting_key, setting_value)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE
         setting_value = VALUES(setting_value)`,
        [settingKey, String(settingValue)]
      );
    }

    await connection.commit();

    return res.status(201).json({
      success: true,
      message: "Registration form saved as draft.",
      eventId,
      formId,
      slug: formSlug,
      status: "draft",
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    console.error("Create form error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to save registration form.",
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// ========================================
// ADMIN: GET ALL REGISTRATION FORMS
// ========================================

router.get("/", verifyAdmin, async (req, res) => {
  try {
    const [forms] = await pool.execute(
      `SELECT
        f.id,
        f.event_id,
        f.title,
        f.slug,
        f.description,
        f.fee,
        f.is_active,
        f.created_at,
        e.title AS event_title,
        e.status AS event_status,
        e.registration_end,
        CASE
          WHEN e.status = 'cancelled' THEN 'cancelled'
          WHEN e.status = 'completed' THEN 'completed'
          WHEN e.status = 'draft' THEN 'draft'
          WHEN f.is_active = 0
            OR (
              e.registration_end IS NOT NULL
              AND e.registration_end < NOW()
            )
          THEN 'closed'
          ELSE 'published'
        END AS registration_status
      FROM forms f
      INNER JOIN events e ON e.id = f.event_id
      ORDER BY f.created_at DESC`
    );

    return res.json({
      success: true,
      forms,
    });
  } catch (error) {
    console.error("Get forms error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve registration forms.",
    });
  }
});

// ========================================
// ADMIN: CHANGE REGISTRATION STATUS
// ========================================

router.patch("/:id/status", verifyAdmin, async (req, res) => {
  const formId = Number(req.params.id);
  const { status } = req.body || {};

  if (!Number.isSafeInteger(formId) || formId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid form ID.",
    });
  }

  if (!["draft", "published", "closed"].includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Status must be draft, published or closed.",
    });
  }

  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [forms] = await connection.execute(
      `SELECT
        f.id,
        f.event_id
      FROM forms f
      INNER JOIN events e ON e.id = f.event_id
      WHERE f.id = ?
      LIMIT 1
      FOR UPDATE`,
      [formId]
    );

    if (!forms.length) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Registration form not found.",
      });
    }

    const eventId = forms[0].event_id;

    if (status === "draft") {
      await connection.execute(
        `UPDATE forms
         SET is_active = 0
         WHERE id = ?`,
        [formId]
      );

      await connection.execute(
        `UPDATE events
         SET status = 'draft'
         WHERE id = ?`,
        [eventId]
      );
    } else if (status === "published") {
      await connection.execute(
        `UPDATE events
         SET status = 'published'
         WHERE id = ?`,
        [eventId]
      );

      await connection.execute(
        `UPDATE forms
         SET is_active = 1
         WHERE id = ?`,
        [formId]
      );
    } else {
      await connection.execute(
        `UPDATE events
         SET status = 'published'
         WHERE id = ?`,
        [eventId]
      );

      await connection.execute(
        `UPDATE forms
         SET is_active = 0
         WHERE id = ?`,
        [formId]
      );
    }

    await connection.commit();

    return res.json({
      success: true,
      message:
        status === "published"
          ? "Registration published successfully."
          : status === "closed"
          ? "Registration closed successfully."
          : "Registration saved as draft.",
      formId,
      status,
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    console.error("Update registration status error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to update registration status.",
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

module.exports = router;
