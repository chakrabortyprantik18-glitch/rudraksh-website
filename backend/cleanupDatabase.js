const { pool } = require("./config/db");

async function cleanDatabase() {
  let connection;

  try {
    connection = await pool.getConnection();

    console.log("");
    console.log("======================================");
    console.log("🧹 RUDRAKSH DATABASE CLEANUP");
    console.log("======================================");

    await connection.query("SET FOREIGN_KEY_CHECKS = 0");

    const tables = [
      "gallery",
      "projects",
      "events",
      "members",
      "faqs",
      "membership_applications",
      "contact_messages",
      "donations",
    ];

    for (const table of tables) {
      console.log(`🗑️ Clearing ${table}...`);

      await connection.query(`TRUNCATE TABLE \`${table}\``);

      console.log(`✅ ${table} cleared`);
    }

    await connection.query("SET FOREIGN_KEY_CHECKS = 1");

    console.log("");
    console.log("======================================");
    console.log("✅ DATABASE CLEANUP COMPLETE");
    console.log("======================================");
    console.log("");
    console.log("Cleared:");
    console.log("• Projects");
    console.log("• Events");
    console.log("• Gallery");
    console.log("• Members");
    console.log("• FAQs");
    console.log("• Membership applications");
    console.log("• Contact messages");
    console.log("• Donations");
    console.log("");
    console.log("Kept:");
    console.log("• Admin accounts");
    console.log("• Site settings");
    console.log("• Social links");
    console.log("• Activity logs");
    console.log("• Database structure");
    console.log("======================================");

  } catch (error) {
    console.error("");
    console.error("======================================");
    console.error("❌ DATABASE CLEANUP FAILED");
    console.error("======================================");
    console.error(error.message);
    console.error("======================================");

    process.exitCode = 1;
  } finally {
    if (connection) {
      connection.release();
    }

    await pool.end();
  }
}

cleanDatabase();