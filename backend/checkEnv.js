require("dotenv").config();

console.log("======================================");
console.log("ENVIRONMENT CHECK");
console.log("======================================");

console.log("DB_HOST:", process.env.DB_HOST || "(missing)");
console.log("DB_PORT:", process.env.DB_PORT || "(missing)");
console.log("DB_USER:", process.env.DB_USER || "(missing)");
console.log(
  "DB_PASSWORD:",
  process.env.DB_PASSWORD
    ? "✅ Password loaded"
    : "❌ Password missing"
);
console.log("DB_NAME:", process.env.DB_NAME || "(missing)");

console.log("======================================");