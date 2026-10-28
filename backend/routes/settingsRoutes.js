const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const { pool } = require("../config/db");
const { authenticateAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

/* =========================================================
   CMS CONFIG
========================================================= */

const CMS_SECTIONS = [
  "hero",
  "impact",
  "about",
  "membership",
  "contact",
  "footer",
];

const contentUploadDir = path.join(
  __dirname,
  "..",
  "uploads",
  "content"
);

if (!fs.existsSync(contentUploadDir)) {
  fs.mkdirSync(contentUploadDir, {
    recursive: true,
  });
}

/* =========================================================
   MULTER
========================================================= */

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, contentUploadDir);
  },

  filename: (req, file, cb) => {
    const extension = path
      .extname(file.originalname)
      .toLowerCase();

    const baseName = path
      .basename(file.originalname, extension)
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60);

    cb(
      null,
      `${baseName || "content"}-${Date.now()}-${Math.round(
        Math.random() * 1e9
      )}${extension}`
    );
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = [
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  if (!allowed.includes(file.mimetype)) {
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

/* =========================================================
   HELPERS
========================================================= */

const getClientIp = (req) => {
  const forwarded =
    req.headers["x-forwarded-for"];

  if (forwarded) {
    return String(forwarded)
      .split(",")[0]
      .trim();
  }

  return (
    req.ip ||
    req.socket?.remoteAddress ||
    "unknown"
  );
};

const deleteContentImage = (imageUrl) => {
  if (!imageUrl) return;

  if (
    !String(imageUrl).includes(
      "/api/settings/content-image/"
    )
  ) {
    return;
  }

  const filename = path.basename(
    String(imageUrl).split("?")[0]
  );

  if (!filename) return;

  const filePath = path.join(
    contentUploadDir,
    filename
  );

  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error(
      "CONTENT IMAGE DELETE ERROR:",
      error
    );
  }
};

const getBaseUrl = (req) => {
  const protocol =
    req.headers["x-forwarded-proto"] ||
    req.protocol;

  return `${protocol}://${req.get("host")}`;
};

const makeImageUrl = (
  req,
  filename
) => {
  if (!filename) return null;

  return `${getBaseUrl(
    req
  )}/api/settings/content-image/${encodeURIComponent(
    filename
  )}`;
};

const parseContent = (value) => {
  if (!value) return {};

  if (typeof value === "object") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
};

/* =========================================================
   ACTIVITY LOG
========================================================= */

async function logSecurityViolation(
  req,
  adminId,
  reason
) {
  try {
    await pool.execute(
      `
      INSERT INTO activity_logs
      (
        admin_id,
        action,
        entity_type,
        entity_id,
        description,
        ip_address,
        user_agent
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        adminId,
        "SECURITY_VIOLATION",
        "admin_account",
        String(adminId),
        reason,
        getClientIp(req),
        req.get("user-agent") || null,
      ]
    );
  } catch (error) {
    console.error(
      "SECURITY LOG ERROR:",
      error
    );
  }
}

/* =========================================================
   RECORD CMS SECURITY VIOLATION

   3 -> 2 -> 1 -> 0

   At zero:
   account locked.
========================================================= */

async function registerCmsViolation(
  req,
  reason
) {
  const adminId = req.admin?.id;

  if (!adminId) {
    return {
      remaining: 0,
      locked: false,
    };
  }

  const connection =
    await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] =
      await connection.execute(
        `
        SELECT
          id,
          role,
          security_attempts_remaining,
          locked_at
        FROM admins
        WHERE id = ?
        FOR UPDATE
        `,
        [adminId]
      );

    if (!rows.length) {
      await connection.rollback();

      return {
        remaining: 0,
        locked: false,
      };
    }

    const admin = rows[0];

    if (admin.role === "super_admin") {
      await connection.rollback();

      return {
        remaining: 3,
        locked: false,
        protected: true,
      };
    }

    if (admin.locked_at) {
      await connection.rollback();

      return {
        remaining: 0,
        locked: true,
      };
    }

    const current = Math.max(
      0,
      Number(
        admin.security_attempts_remaining ?? 3
      )
    );

    const remaining = Math.max(
      0,
      current - 1
    );

    const locked =
      remaining === 0;

    const ip = getClientIp(req);

    await connection.execute(
      `
      UPDATE admins
      SET
        security_attempts_remaining = ?,
        locked_at = CASE
          WHEN ? = 1 THEN NOW()
          ELSE locked_at
        END,
        locked_ip = CASE
          WHEN ? = 1 THEN ?
          ELSE locked_ip
        END,
        lock_reason = CASE
          WHEN ? = 1 THEN ?
          ELSE lock_reason
        END
      WHERE id = ?
      `,
      [
        remaining,
        locked ? 1 : 0,
        locked ? 1 : 0,
        ip,
        locked ? 1 : 0,
        reason,
        adminId,
      ]
    );

    await connection.execute(
      `
      INSERT INTO activity_logs
      (
        admin_id,
        action,
        entity_type,
        entity_id,
        description,
        ip_address,
        user_agent
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        adminId,
        locked
          ? "SECURITY_ACCOUNT_LOCKED"
          : "SECURITY_VIOLATION",
        "admin_account",
        String(adminId),
        locked
          ? `Account automatically locked. Reason: ${reason}`
          : `${reason} Attempts remaining: ${remaining}`,
        ip,
        req.get("user-agent") || null,
      ]
    );

    await connection.commit();

    return {
      remaining,
      locked,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/* =========================================================
   REQUIRE SUPER ADMIN FOR CMS
========================================================= */

async function requireCmsSuperAdmin(
  req,
  res,
  next
) {
  try {
    if (
      req.admin &&
      req.admin.role === "super_admin"
    ) {
      return next();
    }

    const result =
      await registerCmsViolation(
        req,
        "Unauthorized attempt to access Website Content."
      );

    if (result.locked) {
      return res.status(423).json({
        success: false,
        code: "ADMIN_SECURITY_LOCKED",
        message:
          "You have been blocked by the system. Your IP address has been marked as terminated. Please contact the Super Admin.",
        attempts_remaining: 0,
      });
    }

    return res.status(403).json({
      success: false,
      code: "CMS_RESTRICTED",
      message:
        "Website Content is restricted to the Super Administrator.",
      attempts_remaining:
        result.remaining,
    });
  } catch (error) {
    console.error(
      "CMS SUPER ADMIN CHECK ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to verify CMS authorization.",
    });
  }
}

/* =========================================================
   PUBLIC SETTINGS
========================================================= */

const PUBLIC_SETTING_KEYS = [
  "organization_name",
  "organization_email",
  "organization_phone",
  "organization_address",
  "organization_website",
  "whatsapp_url",
  "google_maps_url",
  "instagram_url",
  "facebook_url",
  "linkedin_url",
  "youtube_url",
  "donation_upi_id",
  "donation_message",
  "site_title",
  "site_description",
];

router.get("/", async (req, res) => {
  try {
    const placeholders =
      PUBLIC_SETTING_KEYS
        .map(() => "?")
        .join(", ");

    const [rows] =
      await pool.execute(
        `
        SELECT
          id,
          setting_key,
          setting_value,
          setting_type,
          description
        FROM site_settings
        WHERE setting_key IN (${placeholders})
        ORDER BY setting_key ASC
        `,
        PUBLIC_SETTING_KEYS
      );

    return res.json({
      success: true,
      settings: rows,
    });
  } catch (error) {
    console.error(
      "GET PUBLIC SETTINGS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch settings.",
    });
  }
});

/* =========================================================
   PUBLIC WEBSITE CONTENT

   IMPORTANT:
   This remains public because the frontend website
   needs to read its content.
========================================================= */

router.get(
  "/content",
  async (req, res) => {
    try {
      const keys =
        CMS_SECTIONS.map(
          (section) =>
            `content_${section}`
        );

      const placeholders =
        keys.map(() => "?").join(", ");

      const [rows] =
        await pool.execute(
          `
          SELECT
            setting_key,
            setting_value
          FROM site_settings
          WHERE setting_key IN (${placeholders})
          `,
          keys
        );

      const content = {};

      CMS_SECTIONS.forEach(
        (section) => {
          content[section] = {};
        }
      );

      for (const row of rows) {
        const section =
          row.setting_key.replace(
            "content_",
            ""
          );

        if (
          CMS_SECTIONS.includes(
            section
          )
        ) {
          content[section] =
            parseContent(
              row.setting_value
            );
        }
      }

      return res.json({
        success: true,
        content,
      });
    } catch (error) {
      console.error(
        "GET WEBSITE CONTENT ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load website content.",
      });
    }
  }
);

/* =========================================================
   PUBLIC CONTENT IMAGE
========================================================= */

router.get(
  "/content-image/:filename",
  (req, res) => {
    try {
      const filename =
        path.basename(
          req.params.filename
        );

      if (!filename) {
        return res.status(404).end();
      }

      const filePath =
        path.join(
          contentUploadDir,
          filename
        );

      if (!fs.existsSync(filePath)) {
        return res.status(404).end();
      }

      return res.sendFile(
        filePath
      );
    } catch (error) {
      console.error(
        "CONTENT IMAGE SERVE ERROR:",
        error
      );

      return res.status(404).end();
    }
  }
);

/* =========================================================
   ADMIN CMS CONTENT

   GET /api/settings/content/admin

   Only Super Admin can access.
========================================================= */

router.get(
  "/content/admin",
  authenticateAdmin,
  requireCmsSuperAdmin,
  async (req, res) => {
    try {
      const keys =
        CMS_SECTIONS.map(
          (section) =>
            `content_${section}`
        );

      const placeholders =
        keys.map(() => "?").join(", ");

      const [rows] =
        await pool.execute(
          `
          SELECT
            setting_key,
            setting_value,
            updated_at
          FROM site_settings
          WHERE setting_key IN (${placeholders})
          `,
          keys
        );

      const content = {};

      CMS_SECTIONS.forEach(
        (section) => {
          content[section] = {};
        }
      );

      for (const row of rows) {
        const section =
          row.setting_key.replace(
            "content_",
            ""
          );

        if (
          CMS_SECTIONS.includes(
            section
          )
        ) {
          content[section] =
            parseContent(
              row.setting_value
            );
        }
      }

      return res.json({
        success: true,
        content,
      });
    } catch (error) {
      console.error(
        "GET ADMIN WEBSITE CONTENT ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load website content.",
      });
    }
  }
);

/* =========================================================
   SAVE CMS CONTENT

   Only Super Admin.
========================================================= */

router.put(
  "/content/:section",
  authenticateAdmin,
  upload.single("image"),
  async (req, res) => {
    const section =
      String(
        req.params.section || ""
      ).trim();

    try {
      if (
        !CMS_SECTIONS.includes(
          section
        )
      ) {
        if (req.file) {
          try {
            fs.unlinkSync(
              req.file.path
            );
          } catch {}
        }

        return res.status(400).json({
          success: false,
          message:
            "Invalid CMS section.",
        });
      }

      /* ---------------------------------------------
         SECURITY CHECK
      --------------------------------------------- */

      if (
        req.admin.role !== "super_admin"
      ) {
        if (req.file) {
          try {
            fs.unlinkSync(
              req.file.path
            );
          } catch {}
        }

        const result =
          await registerCmsViolation(
            req,
            `Unauthorized attempt to modify Website Content section "${section}".`
          );

        if (result.locked) {
          return res.status(423).json({
            success: false,
            code:
              "ADMIN_SECURITY_LOCKED",
            message:
              "You have been blocked by the system. Your IP address has been marked as terminated. Please contact the Super Admin.",
            attempts_remaining: 0,
          });
        }

        return res.status(403).json({
          success: false,
          code: "CMS_RESTRICTED",
          message:
            "Website Content is restricted to the Super Administrator.",
          attempts_remaining:
            result.remaining,
        });
      }

      let content =
        parseContent(
          req.body?.content
        );

      const settingKey =
        `content_${section}`;

      const [existingRows] =
        await pool.execute(
          `
          SELECT
            id,
            setting_value
          FROM site_settings
          WHERE setting_key = ?
          LIMIT 1
          `,
          [settingKey]
        );

      let oldContent = {};

      if (existingRows.length) {
        oldContent =
          parseContent(
            existingRows[0]
              .setting_value
          );
      }

      let uploadedImageUrl =
        null;

      /* ---------------------------------------------
         NEW IMAGE
      --------------------------------------------- */

      if (req.file) {
        uploadedImageUrl =
          makeImageUrl(
            req,
            req.file.filename
          );

        content.image =
          uploadedImageUrl;
      }

      /* ---------------------------------------------
         REMOVE IMAGE
      --------------------------------------------- */

      if (
        content.image === null ||
        content.image === ""
      ) {
        if (oldContent.image) {
          deleteContentImage(
            oldContent.image
          );
        }

        content.image = "";
      }

      /* ---------------------------------------------
         KEEP OLD IMAGE
      --------------------------------------------- */

      if (
        !req.file &&
        content.image === undefined
      ) {
        content.image =
          oldContent.image || "";
      }

      const value =
        JSON.stringify(content);

      if (existingRows.length) {
        await pool.execute(
          `
          UPDATE site_settings
          SET
            setting_value = ?,
            setting_type = 'json',
            description = ?
          WHERE setting_key = ?
          `,
          [
            value,
            `Website CMS content for ${section} section`,
            settingKey,
          ]
        );
      } else {
        await pool.execute(
          `
          INSERT INTO site_settings
          (
            setting_key,
            setting_value,
            setting_type,
            description
          )
          VALUES (?, ?, 'json', ?)
          `,
          [
            settingKey,
            value,
            `Website CMS content for ${section} section`,
          ]
        );
      }

      /* ---------------------------------------------
         DELETE OLD IMAGE AFTER SUCCESS
      --------------------------------------------- */

      if (
        req.file &&
        oldContent.image &&
        oldContent.image !==
          uploadedImageUrl
      ) {
        deleteContentImage(
          oldContent.image
        );
      }

      return res.json({
        success: true,
        message:
          "Website content saved successfully.",
        section,
        content,
      });
    } catch (error) {
      console.error(
        "SAVE WEBSITE CONTENT ERROR:",
        error
      );

      if (req.file) {
        try {
          if (
            fs.existsSync(
              req.file.path
            )
          ) {
            fs.unlinkSync(
              req.file.path
            );
          }
        } catch {}
      }

      return res.status(500).json({
        success: false,
        message:
          "Unable to save website content.",
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
   ADMIN — GET ALL SETTINGS
========================================================= */

router.get(
  "/admin",
  authenticateAdmin,
  async (req, res) => {
    try {
      const [rows] =
        await pool.execute(
          `
          SELECT
            id,
            setting_key,
            setting_value,
            setting_type,
            description,
            updated_at
          FROM site_settings
          ORDER BY setting_key ASC
          `
        );

      return res.json({
        success: true,
        settings: rows,
      });
    } catch (error) {
      console.error(
        "GET ADMIN SETTINGS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to fetch settings.",
      });
    }
  }
);

/* =========================================================
   ADMIN — GET SINGLE SETTING
========================================================= */

router.get(
  "/admin/:id",
  authenticateAdmin,
  async (req, res) => {
    try {
      const [rows] =
        await pool.execute(
          `
          SELECT
            id,
            setting_key,
            setting_value,
            setting_type,
            description,
            updated_at
          FROM site_settings
          WHERE id = ?
          LIMIT 1
          `,
          [req.params.id]
        );

      if (!rows.length) {
        return res.status(404).json({
          success: false,
          message:
            "Setting not found.",
        });
      }

      return res.json({
        success: true,
        setting: rows[0],
      });
    } catch (error) {
      console.error(
        "GET ADMIN SETTING ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to fetch setting.",
      });
    }
  }
);

/* =========================================================
   CREATE SETTING
========================================================= */

router.post(
  "/",
  authenticateAdmin,
  async (req, res) => {
    try {
      const {
        setting_key,
        setting_value = null,
        setting_type = "text",
        description = null,
      } = req.body || {};

      if (
        !setting_key ||
        !setting_key.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Setting key is required.",
        });
      }

      const allowedTypes = [
        "text",
        "number",
        "boolean",
        "json",
      ];

      if (
        !allowedTypes.includes(
          setting_type
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid setting type.",
        });
      }

      const key =
        setting_key.trim();

      /* Direct creation of CMS keys is restricted. */

      if (
        key.startsWith("content_") &&
        req.admin.role !== "super_admin"
      ) {
        const result =
          await registerCmsViolation(
            req,
            `Unauthorized attempt to create CMS setting "${key}".`
          );

        return res.status(
          result.locked ? 423 : 403
        ).json({
          success: false,
          code: result.locked
            ? "ADMIN_SECURITY_LOCKED"
            : "CMS_RESTRICTED",
          message: result.locked
            ? "You have been blocked by the system. Please contact the Super Admin."
            : "Website Content is restricted to the Super Administrator.",
          attempts_remaining:
            result.remaining,
        });
      }

      const [existing] =
        await pool.execute(
          `
          SELECT id
          FROM site_settings
          WHERE setting_key = ?
          LIMIT 1
          `,
          [key]
        );

      if (existing.length) {
        return res.status(409).json({
          success: false,
          message:
            "A setting with this key already exists.",
        });
      }

      let value =
        setting_value;

      if (
        setting_type === "json"
      ) {
        if (
          typeof setting_value ===
          "string"
        ) {
          try {
            JSON.parse(
              setting_value
            );
          } catch {
            return res.status(400).json({
              success: false,
              message:
                "Invalid JSON setting value.",
            });
          }
        } else {
          value =
            JSON.stringify(
              setting_value
            );
        }
      }

      const [result] =
        await pool.execute(
          `
          INSERT INTO site_settings
          (
            setting_key,
            setting_value,
            setting_type,
            description
          )
          VALUES (?, ?, ?, ?)
          `,
          [
            key,
            value,
            setting_type,
            description || null,
          ]
        );

      return res.status(201).json({
        success: true,
        message:
          "Setting created successfully.",
        id: result.insertId,
      });
    } catch (error) {
      console.error(
        "CREATE SETTING ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to create setting.",
      });
    }
  }
);

/* =========================================================
   UPDATE SETTING

   If the setting is content_*:
   Super Admin only.
========================================================= */

router.put(
  "/:id",
  authenticateAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;

      const [existing] =
        await pool.execute(
          `
          SELECT
            id,
            setting_key
          FROM site_settings
          WHERE id = ?
          LIMIT 1
          `,
          [id]
        );

      if (!existing.length) {
        return res.status(404).json({
          success: false,
          message:
            "Setting not found.",
        });
      }

      const setting =
        existing[0];

      if (
        setting.setting_key.startsWith(
          "content_"
        ) &&
        req.admin.role !== "super_admin"
      ) {
        const result =
          await registerCmsViolation(
            req,
            `Unauthorized attempt to update CMS setting "${setting.setting_key}".`
          );

        return res.status(
          result.locked ? 423 : 403
        ).json({
          success: false,
          code: result.locked
            ? "ADMIN_SECURITY_LOCKED"
            : "CMS_RESTRICTED",
          message: result.locked
            ? "You have been blocked by the system. Please contact the Super Admin."
            : "Website Content is restricted to the Super Administrator.",
          attempts_remaining:
            result.remaining,
        });
      }

      const {
        setting_key,
        setting_value = null,
        setting_type = "text",
        description = null,
      } = req.body || {};

      const allowedTypes = [
        "text",
        "number",
        "boolean",
        "json",
      ];

      if (
        !allowedTypes.includes(
          setting_type
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid setting type.",
        });
      }

      let value =
        setting_value;

      if (
        setting_type === "json"
      ) {
        if (
          typeof setting_value ===
          "string"
        ) {
          try {
            JSON.parse(
              setting_value
            );
          } catch {
            return res.status(400).json({
              success: false,
              message:
                "Invalid JSON setting value.",
            });
          }
        } else {
          value =
            JSON.stringify(
              setting_value
            );
        }
      }

      if (
        setting_key &&
        setting_key.trim() !==
          setting.setting_key &&
        setting_key
          .trim()
          .startsWith(
            "content_"
          ) &&
        req.admin.role !== "super_admin"
      ) {
        const result =
          await registerCmsViolation(
            req,
            `Unauthorized attempt to rename a setting to CMS key "${setting_key.trim()}".`
          );

        return res.status(
          result.locked ? 423 : 403
        ).json({
          success: false,
          code: result.locked
            ? "ADMIN_SECURITY_LOCKED"
            : "CMS_RESTRICTED",
          message: result.locked
            ? "You have been blocked by the system. Please contact the Super Admin."
            : "Website Content is restricted to the Super Administrator.",
          attempts_remaining:
            result.remaining,
        });
      }

      await pool.execute(
        `
        UPDATE site_settings
        SET
          setting_key = COALESCE(?, setting_key),
          setting_value = ?,
          setting_type = ?,
          description = ?
        WHERE id = ?
        `,
        [
          setting_key &&
          setting_key.trim()
            ? setting_key.trim()
            : null,
          value,
          setting_type,
          description || null,
          id,
        ]
      );

      return res.json({
        success: true,
        message:
          "Setting updated successfully.",
      });
    } catch (error) {
      console.error(
        "UPDATE SETTING ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to update setting.",
      });
    }
  }
);

/* =========================================================
   DELETE SETTING
========================================================= */

router.delete(
  "/:id",
  authenticateAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;

      const [existing] =
        await pool.execute(
          `
          SELECT
            setting_key,
            setting_value
          FROM site_settings
          WHERE id = ?
          LIMIT 1
          `,
          [id]
        );

      if (!existing.length) {
        return res.status(404).json({
          success: false,
          message:
            "Setting not found.",
        });
      }

      const row =
        existing[0];

      if (
        row.setting_key.startsWith(
          "content_"
        ) &&
        req.admin.role !== "super_admin"
      ) {
        const result =
          await registerCmsViolation(
            req,
            `Unauthorized attempt to delete CMS setting "${row.setting_key}".`
          );

        return res.status(
          result.locked ? 423 : 403
        ).json({
          success: false,
          code: result.locked
            ? "ADMIN_SECURITY_LOCKED"
            : "CMS_RESTRICTED",
          message: result.locked
            ? "You have been blocked by the system. Please contact the Super Admin."
            : "Website Content is restricted to the Super Administrator.",
          attempts_remaining:
            result.remaining,
        });
      }

      if (
        row.setting_key.startsWith(
          "content_"
        )
      ) {
        const content =
          parseContent(
            row.setting_value
          );

        if (content.image) {
          deleteContentImage(
            content.image
          );
        }
      }

      await pool.execute(
        `
        DELETE FROM site_settings
        WHERE id = ?
        `,
        [id]
      );

      return res.json({
        success: true,
        message:
          "Setting deleted successfully.",
      });
    } catch (error) {
      console.error(
        "DELETE SETTING ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to delete setting.",
      });
    }
  }
);

/* =========================================================
   MULTER ERROR HANDLER
========================================================= */

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