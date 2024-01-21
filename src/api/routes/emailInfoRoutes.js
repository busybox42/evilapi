const express = require("express");
const router = express.Router();
const dns = require("dns").promises;

// Helper function to check if a hostname exists
async function checkHostname(hostname) {
  try {
    await dns.resolve(hostname);
    return true;
  } catch (error) {
    return false;
  }
}

router.get("/email-info/:domain", async (req, res) => {
  const domain = req.params.domain;

  try {
    const emailInfo = {};

    // Retrieve MX records
    try {
      emailInfo.mxRecords = await dns.resolveMx(domain);
    } catch (error) {
      // No MX records found
    }

    // Retrieve SPF records
    try {
      const spfRecords = await dns.resolveTxt(domain);
      emailInfo.spfRecord = spfRecords
        .filter((record) => record.join("").startsWith("v=spf1"))
        .map((record) => record.join(""));
    } catch (error) {
      // No SPF records found
    }

    // Retrieve DMARC records
    try {
      const dmarcRecords = await dns.resolveTxt(`_dmarc.${domain}`);
      emailInfo.dmarcRecord = dmarcRecords.map((record) => record.join(""));
    } catch (error) {
      // No DMARC records found
    }

    // Retrieve A records
    try {
      emailInfo.aRecord = await dns.resolve(domain);
    } catch (error) {
      // No A records found
    }

    // Check for email client hostnames
    const emailClientHostnames = [
      `mail.${domain}`,
      `pop.${domain}`,
      `pop3.${domain}`,
      `imap.${domain}`,
    ];

    const clientSettingsResults = await Promise.all(
      emailClientHostnames.map(checkHostname)
    );
    emailInfo.clientSettings = emailClientHostnames.filter(
      (hostname, index) => clientSettingsResults[index]
    );

    // Check if any relevant records were found
    if (Object.keys(emailInfo).length === 0) {
      return res
        .status(404)
        .json({ error: "No relevant email records found for the domain" });
    }

    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(emailInfo, null, 2) + "\n");
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching domain information" });
  }
});

module.exports = router;
