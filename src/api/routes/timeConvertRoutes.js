const express = require("express");
const router = express.Router();
const { dateToEpoch, epochToDate } = require("../../utils/timeConverter");

router.get("/convert-to-epoch", (req, res) => {
  const { dateStr, timeZone } = req.query;
  const epochTime = dateToEpoch(dateStr, timeZone);
  res.send(JSON.stringify({ epochTime }, null, 4) + "\n");
});

router.get("/convert-to-date", (req, res) => {
  const { epochTime, timeZone } = req.query;
  const dateStr = epochToDate(parseInt(epochTime), timeZone);
  res.send(JSON.stringify({ dateStr }, null, 4) + "\n");
});

module.exports = router;
