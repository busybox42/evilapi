const express = require("express");
const router = express.Router();

// Route to remove all whitespace from a given text
router.post("/remove-whitespace", async (req, res) => {
  try {
    // Check if text is provided in the request body
    if (!req.body.text) {
      throw new Error("Text is required");
    }

    const noWhitespaceText = req.body.text.replace(/\s/g, "");

    // Prepare the response with pretty-printed JSON
    const response = { result: noWhitespaceText };

    // Set Content-Type header and send the response
    res.setHeader("Content-Type", "application/json");
    res.status(200).send(JSON.stringify(response, null, 2) + "\n");
  } catch (error) {
    // Send error response in case of any issues
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
