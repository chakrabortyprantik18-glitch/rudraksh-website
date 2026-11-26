
const fs = require("fs");
const path = require("path");
const { generatePassPdf } = require("./utils/passGenerator");

async function testPass() {
  try {
    const sampleApplication = {
      application_number: "RUD-TEST-2026-001",

      application_data: {
        participant: {
          fullName: "Sample Participant",
          guardianName: "Sample Guardian",
          schoolName: "Sample School",
          phone: "9876543210",
          email: "sample@example.com",
          dateOfBirth: "2012-05-15",
          address: "Nilambazar, Sribhumi, Assam",
          photo: null,
        },

        performance: {
          category: "DANCE",
          option: "Rabindra Nritya",
          group: "Group A",
        },
      },
    };

    const verificationUrl =
      "https://example.com/api/applications/verify/test";

    const pdf = await generatePassPdf(
      sampleApplication,
      verificationUrl
    );

    const outputPath = path.join(
      __dirname,
      "test-entry-pass.pdf"
    );

    fs.writeFileSync(outputPath, pdf);

    console.log("PDF generated successfully!");
    console.log("File:", outputPath);
  } catch (error) {
    console.error("PDF generation failed:", error);
  }
}

testPass();
