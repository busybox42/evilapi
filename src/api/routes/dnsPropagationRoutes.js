const express = require("express");
const router = express.Router();
const { 
  checkDnsPropagation, 
  checkMultiRecordPropagation, 
  GLOBAL_DNS_SERVERS 
} = require("../../services/dnsPropagationService");
const { validateDnsPropagation } = require("../../middleware/inputValidation");

// Get list of available DNS servers
router.get("/servers", (req, res) => {
  try {
    const serverList = GLOBAL_DNS_SERVERS.map(server => ({
      name: server.name,
      ip: server.ip,
      location: server.location
    }));

    res.json({
      total: serverList.length,
      servers: serverList,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to retrieve DNS servers list",
      message: error.message
    });
  }
});

// Single record type propagation check
router.get("/check", validateDnsPropagation, async (req, res) => {
  try {
    const { hostname, recordType = 'A', customServers } = req.query;
    
    // Parse custom servers if provided
    let parsedCustomServers = [];
    if (customServers) {
      if (typeof customServers === 'string') {
        parsedCustomServers = customServers.split(',').map(server => server.trim());
      } else if (Array.isArray(customServers)) {
        parsedCustomServers = customServers;
      }
    }

    const result = await checkDnsPropagation(hostname, recordType, parsedCustomServers);
    
    res.json(result);
  } catch (error) {
    res.status(400).json({
      error: "DNS propagation check failed",
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Multiple record types propagation check
router.get("/check-multi", validateDnsPropagation, async (req, res) => {
  try {
    const { hostname, recordTypes } = req.query;
    
    // Parse record types if provided
    let parsedRecordTypes = ['A', 'AAAA', 'MX', 'TXT']; // default
    if (recordTypes) {
      if (typeof recordTypes === 'string') {
        parsedRecordTypes = recordTypes.split(',').map(type => type.trim().toUpperCase());
      } else if (Array.isArray(recordTypes)) {
        parsedRecordTypes = recordTypes.map(type => type.toUpperCase());
      }
    }

    const result = await checkMultiRecordPropagation(hostname, parsedRecordTypes);
    
    res.json(result);
  } catch (error) {
    res.status(400).json({
      error: "Multi-record DNS propagation check failed",
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// POST route for bulk propagation checking
router.post("/check-bulk", async (req, res) => {
  try {
    const { hostnames, recordType = 'A', customServers = [] } = req.body;
    
    if (!hostnames || !Array.isArray(hostnames) || hostnames.length === 0) {
      return res.status(400).json({
        error: "Invalid input",
        message: "hostnames must be a non-empty array"
      });
    }

    if (hostnames.length > 10) {
      return res.status(400).json({
        error: "Too many hostnames",
        message: "Maximum 10 hostnames allowed per bulk request"
      });
    }

    const results = await Promise.all(
      hostnames.map(async (hostname) => {
        try {
          return await checkDnsPropagation(hostname, recordType, customServers);
        } catch (error) {
          return {
            hostname,
            error: error.message,
            success: false,
            timestamp: new Date().toISOString()
          };
        }
      })
    );

    const successful = results.filter(r => r.success !== false);
    const failed = results.filter(r => r.success === false);

    res.json({
      total: hostnames.length,
      successful: successful.length,
      failed: failed.length,
      results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: "Bulk DNS propagation check failed",
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});


module.exports = router; 