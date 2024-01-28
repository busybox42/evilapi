const express = require("express");
const router = express.Router();
const { scanPorts } = require("../../services/portScanner");

router.get("/scan", async (req, res) => {
  const { host, port } = req.query;

  if (!host) {
    return res.status(400).send("Host is required");
  }

  try {
    const result = await scanPorts(host, port);
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(result, null, 4) + "\n");
  } catch (error) {
    res.status(500).send(error.message);
  }
});

module.exports = router;
