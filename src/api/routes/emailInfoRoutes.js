const express = require("express");
const router = express.Router();
const { getEmailInfo } = require("../../utils/dnsUtils");
const { asyncHandler, createSuccessResponse, createErrorResponse } = require("../../middleware/errorHandler");

// Domain validation regex
const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-._]*[a-zA-Z0-9]$/;

router.get("/email-info/:domain", asyncHandler(async (req, res) => {
  const domain = req.params.domain;

  // Validate domain format
  if (!domain || !domainRegex.test(domain)) {
    return res.status(400).json(createErrorResponse("Invalid domain format", 400));
  }

  const emailInfo = await getEmailInfo(domain);

  // Check if any relevant records were found
  if (Object.keys(emailInfo).length === 0) {
    return res.status(404).json(createErrorResponse("No relevant email records found for the domain", 404));
  }

  res.json(createSuccessResponse(emailInfo, "Email information retrieved successfully"));
}));

module.exports = router;
