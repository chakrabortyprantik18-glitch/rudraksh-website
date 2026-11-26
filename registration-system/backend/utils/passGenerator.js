
const fs = require("fs");
const path = require("path");
const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");
const QRCode = require("qrcode");

const BACKEND_DIR = path.resolve(__dirname, "..");

const TEMPLATE_PATH = path.join(
  BACKEND_DIR,
  "templates",
  "utsav-entry-pass-template.pdf"
);

const PHOTO_DIR = path.join(
  BACKEND_DIR,
  "uploads",
  "participants"
);

// Actual dimensions of the approved master PDF.
const PAGE_WIDTH = 595.2756;
const PAGE_HEIGHT = 841.8898;

const COLORS = {
  dark: rgb(0.22, 0.15, 0.12),
  cream: rgb(0.973, 0.949, 0.914),
  card: rgb(1, 0.995, 0.98),
  white: rgb(1, 1, 1),
};

function getParticipantPhoto(photoPath) {
  if (
    !photoPath ||
    typeof photoPath !== "string" ||
    photoPath.includes("..") ||
    path.basename(photoPath) !== photoPath
  ) {
    return null;
  }

  const absolutePath = path.resolve(PHOTO_DIR, photoPath);

  if (!absolutePath.startsWith(PHOTO_DIR + path.sep)) {
    return null;
  }

  return fs.existsSync(absolutePath) ? absolutePath : null;
}

function getCompetitionSchedule(category) {
  const normalized = String(category || "").toLowerCase();

  if (normalized.includes("dance")) {
    return {
      date: "29 December 2026",
      reportingTime: "10:30 AM | 30 min early",
    };
  }

  if (normalized.includes("song")) {
    return {
      date: "30 December 2026",
      reportingTime: "10:30 AM | 30 min early",
    };
  }

  if (
    normalized.includes("jemon") ||
    normalized.includes("sajo")
  ) {
    return {
      date: "30 December 2026",
      reportingTime: "4:30 PM | 30 min early",
    };
  }

  return {
    date: "As per event schedule",
    reportingTime: "30 minutes before event",
  };
}

// All coordinates in this file use PDF points,
// measured from the TOP-LEFT corner of the page.

function cover(page, x, top, width, height, color) {
  page.drawRectangle({
    x,
    y: PAGE_HEIGHT - top - height,
    width,
    height,
    color,
  });
}

function writeText(
  page,
  font,
  value,
  x,
  top,
  maxWidth,
  fontSize = 8.2,
  color = COLORS.dark
) {
  const text = String(value || "N/A").trim() || "N/A";

  let size = fontSize;

  while (
    size > 6 &&
    font.widthOfTextAtSize(text, size) > maxWidth
  ) {
    size -= 0.25;
  }

  page.drawText(text, {
    x,
    y: PAGE_HEIGHT - top - size,
    size,
    font,
    color,
    maxWidth,
  });
}

function replaceValue(
  page,
  font,
  value,
  x,
  top,
  width,
  height,
  background,
  fontSize = 8.2
) {
  // Only the value area is covered.
  // Original field labels and borders remain untouched.
  cover(page, x, top, width, height, background);

  writeText(
    page,
    font,
    value,
    x + 1,
    top + 1,
    width - 4,
    fontSize
  );
}

async function embedParticipantPhoto(pdfDoc, photoPath) {
  if (!photoPath) return null;

  const extension = path.extname(photoPath).toLowerCase();
  const bytes = fs.readFileSync(photoPath);

  if (extension === ".jpg" || extension === ".jpeg") {
    return pdfDoc.embedJpg(bytes);
  }

  if (extension === ".png") {
    return pdfDoc.embedPng(bytes);
  }

  throw new Error(
    "Participant photo must be JPG or PNG."
  );
}

function drawImageContain(page, image, x, top, width, height) {
  const scaled = image.scaleToFit(width, height);

  page.drawImage(image, {
    x: x + (width - scaled.width) / 2,
    y: PAGE_HEIGHT - top - (height + scaled.height) / 2 + height / 2,
    width: scaled.width,
    height: scaled.height,
  });
}

async function generatePassPdf(application, verificationUrl) {
  if (!application || !verificationUrl) {
    throw new Error(
      "Application and verification URL are required."
    );
  }

  if (!fs.existsSync(TEMPLATE_PATH)) {
    throw new Error(
      `Approved PDF template not found: ${TEMPLATE_PATH}`
    );
  }

  const applicationData =
    typeof application.application_data === "string"
      ? JSON.parse(application.application_data)
      : application.application_data;

  const participant = applicationData?.participant || {};
  const performance = applicationData?.performance || {};

  const pdfDoc = await PDFDocument.load(
    fs.readFileSync(TEMPLATE_PATH)
  );

  const pages = pdfDoc.getPages();

  if (pages.length !== 1) {
    throw new Error(
      "The Utsav entry-pass template must contain exactly one page."
    );
  }

  const page = pages[0];

  const actualWidth = page.getWidth();
  const actualHeight = page.getHeight();

  if (
    Math.abs(actualWidth - PAGE_WIDTH) > 2 ||
    Math.abs(actualHeight - PAGE_HEIGHT) > 2
  ) {
    throw new Error(
      "The PDF template dimensions have changed. Please check the approved master template."
    );
  }

  const regular = await pdfDoc.embedFont(
    StandardFonts.Helvetica
  );

  const bold = await pdfDoc.embedFont(
    StandardFonts.HelveticaBold
  );

  const schedule = getCompetitionSchedule(
    performance.category
  );

  // ==========================================
  // APPLICATION NUMBER
  // ==========================================

  replaceValue(
    page,
    bold,
    application.application_number,
    37,
    400,
    286,
    13,
    COLORS.cream,
    9.5
  );

  // ==========================================
  // REGISTRATION STATUS
  // ==========================================

  // Keep the original label and rounded field.
  replaceValue(
    page,
    bold,
    "CONFIRMED",
    342,
    400,
    205,
    13,
    COLORS.cream,
    8.5
  );

  // Remove SAMPLE ONLY warning from the header.
  // Preserve the original badge border.
  cover(
    page,
    399,
    367,
    171,
    11,
    COLORS.cream
  );

  // ==========================================
  // PARTICIPANT DETAILS
  // ==========================================

  const fields = [
    {
      value: participant.fullName,
      x: 34,
      top: 462,
      width: 194,
    },
    {
      value: participant.schoolName,
      x: 243,
      top: 462,
      width: 194,
    },
    {
      value: participant.guardianName,
      x: 34,
      top: 498,
      width: 194,
    },
    {
      value: performance.group,
      x: 243,
      top: 498,
      width: 194,
    },
    {
      value: performance.category,
      x: 34,
      top: 534,
      width: 194,
    },
    {
      value: performance.option,
      x: 243,
      top: 534,
      width: 194,
    },
    {
      value: schedule.date,
      x: 34,
      top: 570,
      width: 194,
    },
    {
      value: schedule.reportingTime,
      x: 243,
      top: 570,
      width: 194,
    },
    {
      value: "P.W.D Field, Nilambazar, Sribhumi",
      x: 34,
      top: 607,
      width: 194,
    },
    {
      value: "Rs. 200 | PAID",
      x: 243,
      top: 607,
      width: 194,
    },
  ];

  for (const field of fields) {
    replaceValue(
      page,
      bold,
      field.value,
      field.x,
      field.top,
      field.width,
      12,
      COLORS.card,
      8.2
    );
  }

  // ==========================================
  // PARTICIPANT PHOTO
  // ==========================================

  const photoPath = getParticipantPhoto(
    participant.photo
  );

  if (photoPath) {
    const photo = await embedParticipantPhoto(
      pdfDoc,
      photoPath
    );

    // Inner photo frame. Preserve its original border.
    const photoX = 458;
    const photoTop = 435;
    const photoWidth = 98;
    const photoHeight = 118;

    cover(
      page,
      photoX,
      photoTop,
      photoWidth,
      photoHeight,
      rgb(0.965, 0.935, 0.89)
    );

    // Contain the photo without stretching it.
    const scaled = photo.scaleToFit(
      photoWidth - 4,
      photoHeight - 4
    );

    page.drawImage(photo, {
      x: photoX + (photoWidth - scaled.width) / 2,
      y: PAGE_HEIGHT - photoTop - photoHeight +
        (photoHeight - scaled.height) / 2,
      width: scaled.width,
      height: scaled.height,
    });
  }

  // ==========================================
  // QR CODE
  // ==========================================

  const qrBuffer = await QRCode.toBuffer(
    verificationUrl,
    {
      type: "png",
      width: 500,
      margin: 2,
      errorCorrectionLevel: "H",
    }
  );

  const qrImage = await pdfDoc.embedPng(qrBuffer);

  // Remove the original yellow placeholder and
  // SAMPLE / NOT SCANNABLE text.
  // Keep the QR CODE label and dotted frame.
  cover(
    page,
    389,
    675,
    64,
    53,
    COLORS.white
  );

  const qrSize = 47;

  page.drawImage(qrImage, {
    x: 397,
    y: PAGE_HEIGHT - 675 - qrSize,
    width: qrSize,
    height: qrSize,
  });

  // ==========================================
  // SAVE
  // ==========================================

  return Buffer.from(
    await pdfDoc.save()
  );
}

module.exports = {
  generatePassPdf,
};
