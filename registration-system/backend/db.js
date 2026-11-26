
const mysql = require("mysql2/promise");
const dotenv = require("dotenv");

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: "utf8mb4",
});

async function testDatabaseConnection() {
  let connection;

  try {
    connection = await pool.getConnection();

    const [rows] = await connection.query(
      "SELECT DATABASE() AS database_name"
    );

    const databaseName = rows[0].database_name;

    if (databaseName !== "u971217752_rudrakshforms") {
      throw new Error(`Unexpected database: ${databaseName}`);
    }

    console.log("MYSQL REGISTRATION DATABASE CONNECTED");
    console.log(`Database: ${databaseName}`);

    return true;
  } catch (error) {
    console.error("DATABASE CONNECTION FAILED:", error.message);
    return false;
  } finally {
    if (connection) connection.release();
  }
}

module.exports = {
  pool,
  testDatabaseConnection,
};
