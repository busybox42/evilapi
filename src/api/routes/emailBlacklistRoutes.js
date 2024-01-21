const express = require("express");
const router = express.Router();
const dns = require("dns").promises;
const { checkBlacklist } = require("../../services/checkBlacklist");
const net = require("net");

router.get("/blacklist-check/:identifier", async (req, res) => {
  const identifier = req.params.identifier;

  try {
    let ip;

    // Check if the identifier is an IP address
    if (net.isIP(identifier)) {
      ip = identifier;
    } else {
      // If it's not an IP address, resolve it (either MX for domains or direct resolution for hostnames)
      try {
        const resolvedAddresses = await dns.resolve(identifier);
        if (!resolvedAddresses || resolvedAddresses.length === 0) {
          return res
            .status(404)
            .json({
              error: `IP address not found for identifier: ${identifier}`,
            });
        }
        ip = resolvedAddresses[0];
      } catch (error) {
        // In case of error (e.g., no such hostname), send a response
        return res
          .status(404)
          .json({ error: `Could not resolve identifier: ${identifier}` });
      }
    }

    // Check the IP against each DNSBL service
    const blacklistResults = await checkBlacklist(ip);

    // Format the response
    const response = {
      identifier: identifier,
      ip: ip,
      blacklistResults: blacklistResults,
    };

    // Send pretty-printed JSON response
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(response, null, 2) + "\n");
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error checking blacklist" });
  }
});

module.exports = router;
