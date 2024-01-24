const express = require("express");
const router = express.Router();
const base64Service = require("../../services/base64Service");

// Route for encoding
router.post("/encode", (req, res) => {
  const { text } = req.body;
  const encodedText = base64Service.encode(text);
  res.json({ encodedText });
});

// Route for decoding
router.post("/decode", (req, res) => {
  const { encodedText } = req.body;
  const decodedText = base64Service.decode(encodedText);
  res.json({ decodedText });
});

module.exports = router;
