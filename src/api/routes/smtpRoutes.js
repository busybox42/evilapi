const express = require("express");
const router = express.Router();
const smtpService = require("../../services/smtpService");

// Define the SMTP testing route
router.post('/test', async (req, res) => {
  try {
    const { server, port, testOpenRelay } = req.body;
    
    if (!server || !port) {
      return res.status(400).json({ 
        error: 'Missing required parameters',
        details: 'Server address and port are required'
      });
    }

    const results = await smtpService.testSmtpServer(server, port, testOpenRelay);
    res.json(results);
  } catch (error) {
    res.status(500).json({ 
      error: 'SMTP test failed',
      details: error.message
    });
  }
});

module.exports = router;
