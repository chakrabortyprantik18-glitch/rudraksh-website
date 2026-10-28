
require("dotenv").config({ path: "backend/.env" });

const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

async function main() {
  const caPath = path.join(__dirname, "ca.pem");

  if (!fs.existsSync(caPath)) {
    throw new Error(
      `CA certificate not found: ${caPath}. Save Aiven's ca.pem in the backend folder.`
    );
  }

  const connection = await mysql.createConnection({
    host: process.env.AIVEN_DB_HOST,
    port: Number(process.env.AIVEN_DB_PORT || 10191),
    user: process.env.AIVEN_DB_USER,
    password: process.env.AIVEN_DB_PASSWORD,
    database: process.env.AIVEN_DB_NAME || "defaultdb",
    ssl: {
      ca: fs.readFileSync(caPath, "utf8"),
      rejectUnauthorized: true,
    },
    connectTimeout: 15000,
  });

  try {
    const [rows] = await connection.query(
      "SELECT VERSION() AS version, DATABASE() AS database_name"
    );

    console.log("Aiven connection successful!");
    console.log("MySQL version:", rows[0].version);
    console.log("Database:", rows[0].database_name);
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error("Aiven connection failed:", error.message);
  process.exitCode = 1;
});
