const express = require("express");
const crypto = require("crypto");
const hashService = require("../../services/hashService");
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
router.post("/create-hash", async (req, res) => {
  try {
    const { algorithm, text } = req.body;
    if (!algorithm || !text) {
      return res
        .status(400)
        .send({ error: "Algorithm and text are required." });
    }

    const hash = await hashService.createHash(algorithm, text);
    res.json({ hash });
  } catch (error) {
    console.error("Hash creation failed:", error);
    res.status(500).send({ error: "Failed to create hash." });
  }
});

// Post route for validating password hashes
router.post("/validate-hash", (req, res) => {
  const { algorithm, password, hash } = req.body;

  if (!algorithm || !password || !hash) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (!crypto.getHashes().includes(algorithm)) {
    return res.status(400).json({ error: "Unsupported hash algorithm" });
  }

  try {
    const generatedHash = crypto
      .createHash(algorithm)
      .update(password)
      .digest("hex");
    const isValid = generatedHash === hash;
    res.json({
      isValid,
      algorithm,
      hash,
      generatedHash,
    });
  } catch (error) {
    console.error("Error validating hash:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
