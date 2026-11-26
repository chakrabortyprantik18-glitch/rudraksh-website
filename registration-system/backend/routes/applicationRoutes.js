
const express = require("express");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");
const { pool } = require("../db");
const { uploadParticipantPhoto } = require("../middleware/participantUpload");
const { hashPassToken } = require("../utils/passToken");
const FileType = require("file-type");

const router = express.Router();

function generateApplicationNumber() {
  return `RUD-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

function clean(value, maxLength = 200) {
  return typeof value === "string"
    ? value.trim().slice(0, maxLength)
    : "";
}

function parseJSON(value) {
  try {
    return typeof value === "string" ? JSON.parse(value) : value;
  } catch {
    return null;
  }
}

// ========================================
// PUBLIC: SUBMIT PARTICIPANT APPLICATION
// POST /api/applications
// ========================================

router.post(
  "/",
  (req, res, next) => {
    uploadParticipantPhoto(req, res, (error) => {
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.message || "Photo upload failed.",
        });
      }

      next();
    });
  },
  async (req, res) => {
    let connection;
    let photoPath = null;

    try {
      const formId = Number(req.body.formId);

      if (!Number.isSafeInteger(formId) || formId <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid registration form.",
        });
      }

      const participant = parseJSON(req.body.participant);
      const performance = parseJSON(req.body.performance);

      if (!participant || !performance) {
        return res.status(400).json({
          success: false,
          message: "Invalid participant or competition details.",
        });
      }

      const fullName = clean(participant.fullName);
      const schoolName = clean(participant.schoolName);
      const guardianName = clean(participant.guardianName);
      const phone = clean(participant.phone, 30);
      const email = clean(participant.email, 190);
      const dateOfBirth = clean(participant.dateOfBirth, 20);
      const address = clean(participant.address, 1000);

      if (
        !fullName ||
        !schoolName ||
        !guardianName ||
        !/^\d{10}$/.test(phone) ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      ) {
        return res.status(400).json({
          success: false,
          message: "Please provide valid mandatory participant details.",
        });
      }

      if (
        typeof performance.category !== "string" ||
        typeof performance.option !== "string" ||
        !performance.category.trim() ||
        !performance.option.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Competition and performance type are required.",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Participant photograph is required.",
        });
      }

      const detectedType = await FileType.fromFile(req.file.path);

      const allowedMimeTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
      ];

      if (!detectedType || !allowedMimeTypes.includes(detectedType.mime)) {
        fs.unlinkSync(req.file.path);

        return res.status(400).json({
          success: false,
          message: "Uploaded file is not a valid JPG, PNG or WEBP image.",
        });
      }

      photoPath = req.file.filename;

      connection = await pool.getConnection();
      await connection.beginTransaction();

      const [forms] = await connection.execute(
        `SELECT f.id, f.fee, f.is_active, e.registration_end, e.status
         FROM forms f
         INNER JOIN events e ON e.id = f.event_id
         WHERE f.id = ?
         LIMIT 1
         FOR UPDATE`,
        [formId]
      );

      if (
        !forms.length ||
        forms[0].status !== "published" ||
        Number(forms[0].is_active) !== 1 ||
        (forms[0].registration_end &&
          new Date(forms[0].registration_end).getTime() < Date.now())
      ) {
        await connection.rollback();

        return res.status(400).json({
          success: false,
          message: "Registration is currently closed.",
        });
      }

      const [fields] = await connection.execute(
        `SELECT label, options
         FROM form_fields
         WHERE form_id = ?`,
        [formId]
      );

      const categoryField = fields.find(
        (field) => field.label === performance.category
      );

      const categories = parseJSON(categoryField?.options);

      const selectedOption = Array.isArray(categories)
        ? categories.find(
            (item) =>
              (typeof item === "string" ? item : item.name) ===
              performance.option
          )
        : null;

      if (!categoryField || !selectedOption) {
        await connection.rollback();

        return res.status(400).json({
          success: false,
          message: "Invalid competition selection.",
        });
      }

      const groups = Array.isArray(selectedOption.groups)
        ? selectedOption.groups
        : [];

      if (groups.length > 0) {
        const validGroup = groups.some(
          (group) =>
            (typeof group === "string"
              ? group
              : group.name || group.label) === performance.group
        );

        if (!validGroup) {
          await connection.rollback();

          return res.status(400).json({
            success: false,
            message: "Invalid participant group.",
          });
        }
      }

      const fee = Number(forms[0].fee);

      if (!Number.isFinite(fee) || fee < 0) {
        throw new Error("Invalid registration fee configured.");
      }

      const applicationNumber = generateApplicationNumber();

      const applicationData = {
        participant: {
          fullName,
          schoolName,
          guardianName,
          phone,
          email,
          dateOfBirth,
          address,
          photo: photoPath,
        },
        performance: {
          category: performance.category.trim(),
          option: performance.option.trim(),
          group: clean(performance.group, 100),
        },
      };

      const [applicationResult] = await connection.execute(
        `INSERT INTO applications
         (form_id, application_number, applicant_name, applicant_email,
          applicant_phone, application_data, status)
         VALUES (?, ?, ?, ?, ?, ?, 'pending_payment')`,
        [
          formId,
          applicationNumber,
          fullName,
          email,
          phone,
          JSON.stringify(applicationData),
        ]
      );

      await connection.commit();

      return res.status(201).json({
        success: true,
        message: "Application saved. Proceed to payment.",
        applicationId: applicationResult.insertId,
        applicationNumber,
        amount: fee,
        currency: "INR",
      });
    } catch (error) {
      if (connection) {
        await connection.rollback();
      }

      if (photoPath) {
        const filePath = path.join(
          __dirname,
          "..",
          "uploads",
          "participants",
          photoPath
        );

        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      console.error("Application submission error:", error.message);

      return res.status(500).json({
        success: false,
        message: "Unable to submit application.",
      });
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }
);

// ========================================
// PUBLIC: VERIFY ENTRY PASS USING QR TOKEN
// GET /api/applications/verify/:token
// ========================================

router.get("/verify/:token", async (req, res) => {
  try {
    const tokenHash = hashPassToken(req.params.token);

    if (!tokenHash) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: "Invalid verification code.",
      });
    }

    const [rows] = await pool.execute(
      `SELECT
         application_number,
         applicant_name,
         application_data,
         status
       FROM applications
       WHERE pass_token_hash = ?
       LIMIT 1`,
      [tokenHash]
    );

    if (!rows.length || rows[0].status !== "confirmed") {
      return res.status(404).json({
        success: false,
        valid: false,
        message: "Entry pass not found or not valid.",
      });
    }

    const applicationData = parseJSON(rows[0].application_data);
    const performance = applicationData?.performance || {};

    return res.json({
      success: true,
      valid: true,
      message: "Valid Utsav 2026 entry pass.",
      participant: rows[0].applicant_name,
      applicationNumber: rows[0].application_number,
      category: performance.category || "N/A",
      competition: performance.option || "N/A",
      group: performance.group || "N/A",
    });
  } catch (error) {
    console.error("Pass verification error:", error.message);

    return res.status(500).json({
      success: false,
      valid: false,
      message: "Unable to verify entry pass.",
    });
  }
});

module.exports = router;
