require("dotenv").config({ path: "backend/.env" });

const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.AIVEN_DB_HOST,
    port: Number(process.env.AIVEN_DB_PORT || 10191),
    user: process.env.AIVEN_DB_USER,
    password: process.env.AIVEN_DB_PASSWORD,
    database: process.env.AIVEN_DB_NAME || "defaultdb",
    ssl: {
      ca: fs.readFileSync(path.join(__dirname, "ca.pem"), "utf8"),
      rejectUnauthorized: true,
    },
  });

  try {
    const [tables] = await connection.query("SHOW TABLES");
    console.log("Tables currently in Aiven:");

    if (tables.length === 0) {
      console.log("(No tables yet)");
    } else {
      tables.forEach((table) => console.log(Object.values(table)[0]));
    }
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error("Aiven check failed:", error.message);
  process.exitCode = 1;
});