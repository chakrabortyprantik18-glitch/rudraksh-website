
require("dotenv").config();

const {
  verifyEmailConnection,
} = require("./utils/emailService");

async function testEmail() {
  try {
    console.log("Checking Gmail SMTP connection...");

    await verifyEmailConnection();

    console.log("SUCCESS: Gmail SMTP connection verified.");
    process.exitCode = 0;
  } catch (error) {
    console.error("EMAIL CONNECTION FAILED:");
    console.error(error.message);
    process.exitCode = 1;
  }
}

testEmail();