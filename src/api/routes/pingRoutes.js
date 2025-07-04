const express = require("express");
const router = express.Router();
const { pingHost, tracerouteHost, pingHostStream, tracerouteHostStream } = require("../../services/pingService");

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

// Streaming ping route
router.get("/ping-stream/:host", async (req, res) => {
  const { host } = req.params;
  
  // Set up Server-Sent Events
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': 'http://localhost:8080',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  const sendData = (data) => {
    res.write(`data: ${JSON.stringify({ type: 'data', content: data })}\n\n`);
  };

  const sendEnd = () => {
    res.write(`data: ${JSON.stringify({ type: 'end' })}\n\n`);
    res.end();
  };

  const sendError = (error) => {
    res.write(`data: ${JSON.stringify({ type: 'error', content: error.message })}\n\n`);
    res.end();
  };

  try {
    pingHostStream(host, sendData, sendEnd, sendError);
  } catch (error) {
    sendError(error);
  }
});

// Streaming traceroute route
router.get("/traceroute-stream/:host", async (req, res) => {
  const { host } = req.params;
  
  // Set up Server-Sent Events
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': 'http://localhost:8080',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  const sendData = (data) => {
    res.write(`data: ${JSON.stringify({ type: 'data', content: data })}\n\n`);
  };

  const sendEnd = () => {
    res.write(`data: ${JSON.stringify({ type: 'end' })}\n\n`);
    res.end();
  };

  const sendError = (error) => {
    res.write(`data: ${JSON.stringify({ type: 'error', content: error.message })}\n\n`);
    res.end();
  };

  try {
    tracerouteHostStream(host, sendData, sendEnd, sendError);
  } catch (error) {
    sendError(error);
  }
});

module.exports = router;
