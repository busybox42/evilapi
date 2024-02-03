const express = require("express");
const router = express.Router();
const { pingHost, tracerouteHost } = require("../../services/pingService");

// Ping route
router.get("/ping/:host", async (req, res) => {
  try {
    const { host } = req.params;
    const result = await pingHost(host);

    // Prepare the response with pretty-printed JSON and a newline at the end
    const response = { success: true, result: result.trim() };
    res.setHeader("Content-Type", "application/json");
    res.status(200).send(JSON.stringify(response, null, 2) + "\n");
  } catch (error) {
    const errorResponse = { success: false, message: error.message };
    res.setHeader("Content-Type", "application/json");
    res.status(500).send(JSON.stringify(errorResponse, null, 2) + "\n");
  }
});

// Traceroute route
router.get("/traceroute/:host", async (req, res) => {
  try {
    const { host } = req.params;
    const result = await tracerouteHost(host);

    // Prepare the response with pretty-printed JSON and a newline at the end
    const response = { success: true, result: result.trim() };
    res.setHeader("Content-Type", "application/json");
    res.status(200).send(JSON.stringify(response, null, 2) + "\n");
  } catch (error) {
    const errorResponse = { success: false, message: error.message };
    res.setHeader("Content-Type", "application/json");
    res.status(500).send(JSON.stringify(errorResponse, null, 2) + "\n");
  }
});

module.exports = router;
