const express = require("express");
const router = express.Router();
const sslValidationService = require("../../services/sslValidationService");

router.get("/validate-ssl", async (req, res) => {
  try {
    const hostname = req.query.hostname;
    const port = req.query.port ? parseInt(req.query.port, 10) : 443;
    
    console.log(`SSL Validation API: Request received for ${hostname}:${port}`);
    
    if (!hostname) {
      console.log("SSL Validation API: No hostname provided");
      return res.status(400).json({ error: "Hostname is required" });
    }

    console.log(`SSL Validation API: Calling validateSSL for ${hostname}:${port}`);
    const sslValidationResult = await sslValidationService.validateSSL(
      hostname,
      port
    );

    console.log(`SSL Validation API: Validation completed for ${hostname}:${port}`, sslValidationResult);

    // Respond with pretty formatted JSON
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(sslValidationResult, null, 4) + "\n");
  } catch (error) {
    console.error("SSL Validation API: Error in validate-ssl route:", error);
    console.error("SSL Validation API: Error stack:", error.stack);
    res.status(500).json({ 
      error: "Internal Server Error", 
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;
