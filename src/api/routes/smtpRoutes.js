const express = require("express");
const router = express.Router();
const smtpTestService = require("../../services/smtpService");

// Define the SMTP testing route
router.post("/test-smtp", async (req, res) => {
  try {
    const { serverAddress, port } = req.body;
    const smtpPort = port || 25; // Default to port 25 if not specified

    // Perform SMTP server test using the service
    const report = await smtpTestService.testSmtpServer(
      serverAddress,
      smtpPort
    );

    // Send the response with pretty-printed JSON
    res.setHeader("Content-Type", "application/json");
    res.status(200).send(JSON.stringify(report, null, 2) + "\n");
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
