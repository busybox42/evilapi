const express = require("express");
const router = express.Router();
const sslValidationService = require("../../services/sslValidationService");

router.get("/validate-ssl", async (req, res) => {
  try {
    const hostname = req.query.hostname;
    if (!hostname) {
      return res.status(400).json({ error: "Hostname is required" });
    }

    const sslValidationResult = await sslValidationService.validateSSL(
      hostname
    );

    // Respond with pretty formatted JSON
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(sslValidationResult, null, 4) + "\n");
  } catch (error) {
    console.error("Error in validate-ssl route:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
