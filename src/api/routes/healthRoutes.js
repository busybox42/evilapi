const express = require("express");
const router = express.Router();

// Health check endpoint
router.get("/health", (req, res) => {
  const healthCheck = {
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    message: "EvilAPI is running",
    environment: process.env.NODE_ENV || "development",
  };

  try {
    res.status(200).json(healthCheck);
  } catch (error) {
    healthCheck.status = "error";
    healthCheck.message = error.message;
    res.status(503).json(healthCheck);
  }
});

// Readiness check endpoint (alias for health)
router.get("/ready", (req, res) => {
  res.status(200).json({
    status: "ready",
    timestamp: new Date().toISOString(),
    message: "EvilAPI is ready to accept requests",
  });
});

// Liveness check endpoint (alias for health)
router.get("/live", (req, res) => {
  res.status(200).json({
    status: "alive",
    timestamp: new Date().toISOString(),
    message: "EvilAPI is alive",
  });
});

module.exports = router; 