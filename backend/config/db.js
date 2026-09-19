const mysql = require("mysql2/promise");
const dotenv = require("dotenv");

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "rudraksh_db",

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

    console.log("======================================");
    console.log("✅ MYSQL DATABASE CONNECTED");
    console.log("======================================");
    console.log(`Database: ${process.env.DB_NAME || "rudraksh_db"}`);
    console.log("======================================");
  } catch (error) {
    console.error("======================================");
    console.error("❌ MYSQL DATABASE CONNECTION FAILED");
    console.error("======================================");
    console.error(error.message);
    console.error("======================================");
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

module.exports = {
  pool,
  testDatabaseConnection,
};