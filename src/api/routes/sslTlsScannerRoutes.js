const express = require('express');
const router = express.Router();
const { scanSslTls } = require('../../services/sslTlsScannerService');
const { validateSslScan } = require('../../middleware/inputValidation');

// POST /api/ssl-scan
router.post('/ssl-scan', validateSslScan, async (req, res) => {
  const { host, port } = req.body;
  if (!host || typeof host !== 'string') {
    return res.status(400).json({ error: 'Host is required' });
  }
  try {
    const result = await scanSslTls({ host, port });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'SSL/TLS scan failed', message: error.message });
  }
});

module.exports = router; 