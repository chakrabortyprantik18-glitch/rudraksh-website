
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { testDatabaseConnection } = require("./db");

const authRoutes = require("./routes/authRoutes");
const formRoutes = require("./routes/formRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const adminApplicationRoutes = require("./routes/adminApplicationRoutes");
const adminPaymentRoutes = require("./routes/adminPaymentRoutes");

const app = express();

// Middleware
app.use(cors());

app.use(
  express.json({
    verify: (req, res, buffer) => {
      if (req.originalUrl === "/api/payments/webhook") {
        req.rawBody = Buffer.from(buffer);
      }
    },
  })
);

// API health check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Rudraksh Registration API is running",
  });
});

// Database health check
app.get("/api/health", async (req, res) => {
  try {
    const connected = await testDatabaseConnection();

    res.status(connected ? 200 : 503).json({
      success: connected,
      database: connected ? "connected" : "disconnected",
    });
  } catch (error) {
    console.error("Health check error:", error.message);

    res.status(503).json({
      success: false,
      database: "disconnected",
    });
  }
});

// Authentication routes
app.use("/api/auth", authRoutes);

// Registration management routes
app.use("/api/forms", formRoutes);

// Participant application routes
app.use("/api/applications", applicationRoutes);

// Razorpay payment routes
app.use("/api/payments", paymentRoutes);

// Admin application management routes
app.use("/api/admin/applications", adminApplicationRoutes);

// Admin payment management routes
app.use("/api/admin/payments", adminPaymentRoutes);

// Start server
const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Registration API running on port ${PORT}`);
});
