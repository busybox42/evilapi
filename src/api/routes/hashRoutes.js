const express = require("express");
const crypto = require("crypto");
const hashService = require("../../services/hashService");
const { validateHash } = require("../../middleware/inputValidation");
const { asyncHandler, createSuccessResponse } = require("../../middleware/errorHandler");
const router = express.Router();

// Set JSON spaces for pretty printing and add a new line at the end
router.use((req, res, next) => {
  express.json({ spaces: 2 })(req, res, (err) => {
    if (err) return next(err);
    res.json = (body) => {
      res.setHeader("Content-Type", "application/json");
      res.send(JSON.stringify(body, null, 2) + "\n");
    };
    next();
  });
});

// POST endpoint for creating a hash
router.post("/create-hash", validateHash, asyncHandler(async (req, res) => {
  const { algorithm, text } = req.body;
  const hash = await hashService.createHash(algorithm, text);
  res.json(createSuccessResponse({ hash }, "Hash created successfully"));
}));

// Post route for validating password hashes
router.post("/validate-hash", validateHash, asyncHandler(async (req, res) => {
  const { algorithm, password, hash } = req.body;

  const generatedHash = crypto
    .createHash(algorithm)
    .update(password)
    .digest("hex");
  const isValid = generatedHash === hash;

  res.json(createSuccessResponse({
    isValid,
    algorithm,
    // Note: Don't return the original hash in production for security
  }, isValid ? "Hash validation successful" : "Hash validation failed"));
}));

module.exports = router;
