
require("dotenv").config({ path: "backend/.env" });

const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

const ca = fs.readFileSync(path.join(__dirname, "ca.pem"), "utf8");

async function main() {
  let local;
  let remote;

  try {
    local = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || "rudraksh_db",
      charset: "utf8mb4",
    });

    remote = await mysql.createConnection({
      host: process.env.AIVEN_DB_HOST,
      port: Number(process.env.AIVEN_DB_PORT || 10191),
      user: process.env.AIVEN_DB_USER,
      password: process.env.AIVEN_DB_PASSWORD,
      database: process.env.AIVEN_DB_NAME || "defaultdb",
      ssl: { ca, rejectUnauthorized: true },
      charset: "utf8mb4",
    });

    const [existing] = await remote.query("SHOW TABLES");
    if (existing.length > 0) {
      throw new Error(
        "Aiven database is not empty. Migration stopped to protect existing tables."
      );
    }

    const [tableRows] = await local.query("SHOW TABLES");
    const tables = tableRows.map((row) => Object.values(row)[0]);
    const snapshots = [];

    console.log(`Found ${tables.length} local tables.`);

    // Read source schemas and data before modifying Aiven.
    for (const table of tables) {
      const safe = "`" + table.replace(/`/g, "``") + "`";
      const [ddlRows] = await local.query(`SHOW CREATE TABLE ${safe}`);
      const [rows] = await local.query(`SELECT * FROM ${safe}`);

      snapshots.push({
        name: table,
        ddl: ddlRows[0]["Create Table"],
        rows,
      });

      console.log(`Read ${table}: ${rows.length} rows`);
    }

    await remote.query("SET FOREIGN_KEY_CHECKS = 0");

    try {
      // Create all tables before inserting data.
      for (const table of snapshots) {
        await remote.query(table.ddl);
        console.log(`Created ${table.name}`);
      }

      // Import rows using parameterized statements.
      for (const table of snapshots) {
        if (table.rows.length === 0) continue;

        const columns = Object.keys(table.rows[0]);
        const quotedColumns = columns
          .map((c) => "`" + c.replace(/`/g, "``") + "`")
          .join(", ");
        const placeholders = columns.map(() => "?").join(", ");
        const safe = "`" + table.name.replace(/`/g, "``") + "`";

        for (const row of table.rows) {
          const values = columns.map((column) => row[column]);
          await remote.execute(
            `INSERT INTO ${safe} (${quotedColumns}) VALUES (${placeholders})`,
            values
          );
        }

        console.log(`Imported ${table.name}: ${table.rows.length} rows`);
      }
    } finally {
      await remote.query("SET FOREIGN_KEY_CHECKS = 1");
    }

    console.log("\nVerifying destination row counts:");
    let totalRows = 0;

    for (const table of snapshots) {
      const safe = "`" + table.name.replace(/`/g, "``") + "`";
      const [countRows] = await remote.query(
        `SELECT COUNT(*) AS total FROM ${safe}`
      );

      const actual = Number(countRows[0].total);
      const expected = table.rows.length;

      console.log(`${table.name}: expected ${expected}, found ${actual}`);

      if (actual !== expected) {
        throw new Error(`Row-count mismatch in ${table.name}`);
      }

      totalRows += actual;
    }

    console.log(
      `\nMigration verified: ${tables.length} tables, ${totalRows} rows.`
    );
    console.log("The local database was not modified.");
  } finally {
    if (local) await local.end();
    if (remote) await remote.end();
  }
}

main().catch((error) => {
  console.error("Migration failed:", error.message);
  process.exitCode = 1;
});
