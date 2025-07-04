const express = require("express");
const router = express.Router();
const headerAnalysisService = require("../../services/headerAnalysisService");

// Middleware to parse text/plain request body with increased limit
router.use(express.text({ type: "text/plain", limit: "10mb" }));

router.post("/analyze-headers", async (req, res) => {
  try {
    // Ensure that header data is provided
    if (!req.body || typeof req.body !== "string" || req.body.trim() === "") {
      return res.status(400).json({ error: "No header data provided" });
    }

    // Analyze the headers
    const analysisResult = await headerAnalysisService.analyze(req.body);
    res.status(200).send(JSON.stringify(analysisResult, null, 2) + "\n");
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
