const express = require("express");
const multer = require("multer");
const router = express.Router();
const {
  scanEmailWithSpamAssassin,
} = require("../../services/spamAssassinService");

// Set up multer to store files in memory
const upload = multer({ storage: multer.memoryStorage() });

router.post("/scan-email", upload.single("emailFile"), async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .send(
          JSON.stringify({ error: "Email file is required" }, null, 2) + "\n"
        );
    }
    const emailContent = req.file.buffer.toString("utf-8");
    const result = await scanEmailWithSpamAssassin(emailContent);
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(result, null, 2) + "\n"); // Pretty print JSON with newline
  } catch (error) {
    res
      .status(500)
      .send(JSON.stringify({ error: error.message }, null, 2) + "\n"); // Pretty print JSON with newline
  }
});

module.exports = router;
