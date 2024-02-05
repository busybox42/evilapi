const express = require("express");
const router = express.Router();
const { encodeString, decodeString } = require("../../utils/urlEncoderDecoder");

// Route for encoding a URL
router.post("/url-encode", (req, res) => {
  const { toEncode } = req.body;
  if (!toEncode) {
    return res.status(400).send("No string provided for encoding.");
  }
  const encodedString = encodeString(toEncode);
  // Ensure the response is a JSON object
  res.send(JSON.stringify({ encodedString }, null, 2) + "\n");
});

// Route for decoding a URL
router.post("/url-decode", (req, res) => {
  const { toDecode } = req.body;
  if (!toDecode) {
    return res.status(400).send("No string provided for decoding.");
  }
  const decodedString = decodeString(toDecode);
  // Ensure the response is a JSON object
  res.send(JSON.stringify({ decodedString }, null, 2) + "\n");
});

module.exports = router;
