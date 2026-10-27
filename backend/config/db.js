
const mysql = require("mysql2/promise");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");

dotenv.config();

const sslEnabled = process.env.DB_SSL === "true";

const sslOptions = sslEnabled
  ? {
      ca: process.env.DB_SSL_CA_BASE64
        ? Buffer.from(
            process.env.DB_SSL_CA_BASE64,
            "base64"
          ).toString("utf8")
        : fs.readFileSync(
            path.join(__dirname, "..", "ca.pem"),
            "utf8"
          ),
      rejectUnauthorized: true,
    }
  : undefined;

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "rudraksh_db",

  ...(sslOptions ? { ssl: sslOptions } : {}),

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: "utf8mb4",
});

async function testDatabaseConnection() {
  let connection;

  try {
    connection = await pool.getConnection();
    await connection.query("SELECT 1");

    console.log("MYSQL DATABASE CONNECTED");
    console.log(`Database: ${process.env.DB_NAME || "rudraksh_db"}`);
  } catch (error) {
    console.error("MYSQL DATABASE CONNECTION FAILED");
    console.error(error.message);
  } finally {
    if (connection) connection.release();
  }
}

module.exports = {
  pool,
  testDatabaseConnection,
};
