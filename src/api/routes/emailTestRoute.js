const express = require("express");
const router = express.Router();
const { testEmailDelivery } = require("../../services/emailTestService");

// Define the email test route
router.post("/test-email-delivery", async (req, res) => {
  try {
    const result = await testEmailDelivery(req.body);
    // Using JSON.stringify for pretty-printing
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(result, null, 2) + "\n"); // 2 spaces for indentation, newline at the end
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
