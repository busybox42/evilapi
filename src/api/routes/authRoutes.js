const express = require("express");
const router = express.Router();
const { authService } = require("../../services/authService");
const { validateAuth } = require("../../middleware/inputValidation");
const { asyncHandler, createSuccessResponse, createErrorResponse } = require("../../middleware/errorHandler");

router.post("/auth", validateAuth, asyncHandler(async (req, res) => {
  const { username, password, hostname, protocol } = req.body;

  try {
    const result = await authService(username, password, hostname, protocol);
    
    // Don't include sensitive information in success response
    res.json(createSuccessResponse(
      {
        protocol: result.protocol,
        success: result.success,
        message: result.message || "Authentication successful"
      },
      "Authentication successful"
    ));
  } catch (error) {
    // Log the actual error for debugging, but don't expose details
    console.error(`Authentication failed for user ${username} on ${hostname}:`, error.message);
    
    // Return generic error to prevent information disclosure
    res.status(401).json(createErrorResponse(
      "Authentication failed. Please check your credentials and try again.",
      401
    ));
  }
}));

module.exports = router;
