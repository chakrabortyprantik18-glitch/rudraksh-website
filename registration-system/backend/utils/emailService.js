
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 465),
  secure: Number(process.env.SMTP_PORT || 465) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function verifyEmailConnection() {
  return transporter.verify();
}

async function sendUtsavConfirmationEmail({
  to,
  participantName,
  applicationId,
  category,
  performance,
  group,
  passDownloadUrl,
}) {
  if (!to || !passDownloadUrl) {
    throw new Error("Recipient email and entry pass URL are required.");
  }

  return transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: "Utsav 2026 Registration Confirmed",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#222">
        <h2 style="color:#7b1e2b">Rudraksh Utsav 2026</h2>
        <h3>Registration Confirmed!</h3>
        <p>Dear ${escapeHtml(participantName || "Participant")},</p>
        <p>Your registration and payment have been successfully verified.</p>
        <p><strong>Application ID:</strong> ${escapeHtml(applicationId)}</p>
        <p><strong>Category:</strong> ${escapeHtml(category)}</p>
        <p><strong>Performance:</strong> ${escapeHtml(performance)}</p>
        ${group ? `<p><strong>Group:</strong> ${escapeHtml(group)}</p>` : ""}
        <p style="margin:28px 0">
          <a href="${escapeHtml(passDownloadUrl)}"
             style="background:#7b1e2b;color:white;padding:14px 22px;text-decoration:none;border-radius:5px">
            DOWNLOAD ENTRY PASS
          </a>
        </p>
        <p>Please bring your entry pass to the event.</p>
        <p>Regards,<br>Rudraksh Social & Cultural Organization</p>
      </div>
    `,
  });
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

module.exports = {
  verifyEmailConnection,
  sendUtsavConfirmationEmail,
};
