const express = require("express");
const router = express.Router();
const base64Service = require("../../services/base64Service");
const { asyncHandler, createSuccessResponse, createErrorResponse } = require("../../middleware/errorHandler");

// Route for encoding
router.post("/encode", asyncHandler(async (req, res) => {
  const { text } = req.body;
  
  if (!text) {
    return res.status(400).json(createErrorResponse("Text is required", 400));
  }
  
  const encodedText = await base64Service.encode(text);
  res.json(createSuccessResponse({ encodedText }, "Text encoded successfully"));
}));

// Route for decoding
router.post("/decode", asyncHandler(async (req, res) => {
  const { encodedText } = req.body;
  
  if (!encodedText) {
    return res.status(400).json(createErrorResponse("Encoded text is required", 400));
  }
  
  const decodedText = await base64Service.decode(encodedText);
  res.json(createSuccessResponse({ decodedText }, "Text decoded successfully"));
}));

module.exports = router;
