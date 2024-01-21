const express = require("express");
const router = express.Router();
const whoamiService = require("../../services/whoamiService");

router.get("/whoami", async (req, res) => {
  try {
    const clientIp = req.query.ip || req.ip;
    const whoamiData = await whoamiService.getWhoamiData(clientIp);

    // Respond with pretty formatted JSON
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(whoamiData, null, 4) + "\n");
  } catch (error) {
    console.error("Error in whoami route:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
