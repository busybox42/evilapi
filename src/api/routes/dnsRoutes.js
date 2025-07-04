const express = require("express");
const { dnsLookup } = require("../../utils/dnsUtils");
const router = express.Router();

router.get("/lookup", async (req, res) => {
  try {
    const { host, type, dnsServer } = req.query;
    const result = await dnsLookup(host, type, dnsServer);

    const prettyJson = JSON.stringify(result, null, 4) + "\n";

    // Set Content-Type header to 'application/json'
    res.header("Content-Type", "application/json");
    res.send(prettyJson);
  } catch (error) {
    // Ensure error messages are also prettified
    const prettyError =
      JSON.stringify({ error: "Failed to perform DNS lookup." }, null, 4) +
      "\n";
    res.header("Content-Type", "application/json");
    res.status(500).send(prettyError);
  }
});

module.exports = router;
