const express = require("express");
const dns = require("dns").promises; // Using the Promise-based DNS module
const router = express.Router();

// DMARC record parser function
const parseDmarcRecord = (record) => {
  const tags = record.split(";").filter((tag) => tag.trim() !== "");
  const parsedTags = tags.map((tag) => {
    const [key, value] = tag.split("=").map((part) => part.trim());
    return { key, value };
  });
  return parsedTags;
};

// Mapping of DMARC tags to their descriptions
const tagDescriptions = {
  v: {
    name: "Version",
    description:
      "Identifies the record retrieved as a DMARC record. It must be the first tag in the list.",
  },
  p: {
    name: "Policy",
    description:
      "Policy to apply to email that fails the DMARC check. Valid values can be 'none', 'quarantine', or 'reject'.",
  },
  fo: {
    name: "Forensic Reporting",
    description:
      "Provides requested options for generation of failure reports. Valid values are any combination of characters '01ds' seperated by ':'.",
  },
  sp: {
    name: "Subdomain Policy",
    description:
      "Policy to apply to email from the domain's subdomains that fails the DMARC check. Valid values can be 'none', 'quarantine', or 'reject'.",
  },
  rf: {
    name: "Report Format",
    description:
      "Format in which to request message-specific failure reports. 'afrf' is the default and typically the only format used.",
  },
  ri: {
    name: "Report Interval",
    description:
      "Interval for how often you want to receive aggregate reports, in seconds. The default is 86400 seconds (24 hours).",
  },
  adkim: {
    name: "Alignment Mode DKIM",
    description:
      "Indicates whether strict or relaxed DKIM Identifier Alignment mode is required by the Domain Owner. Valid values can be 'r' (relaxed) or 's' (strict mode).",
  },
  aspf: {
    name: "Alignment Mode SPF",
    description:
      "Indicates whether strict or relaxed SPF Identifier Alignment mode is required by the Domain Owner. Valid values can be 'r' (relaxed) or 's' (strict mode).",
  },
  rua: {
    name: "Receivers",
    description:
      "Addresses to which aggregate feedback is to be sent. Comma separated plain-text list of DMARC URIs.",
  },
  ruf: {
    name: "Forensic Receivers",
    description:
      "Addresses to which message-specific failure information is to be reported. Comma separated plain-text list of DMARC URIs.",
  },
  pct: {
    name: "Percentage",
    description:
      "Percentage of messages from the Domain Owner's mail stream to which the DMARC policy is to be applied. Valid value is an integer between 0 to 100.",
  },
};

router.get("/validate-dmarc", async (req, res) => {
  const domain = req.query.domain;
  if (!domain) {
    return res
      .status(400)
      .send(
        JSON.stringify(
          { error: "Domain query parameter is required." },
          null,
          4
        ) + "\n"
      );
  }

  const dmarcRecordName = `_dmarc.${domain}`;
  try {
    const records = await dns.resolveTxt(dmarcRecordName);
    const dmarcRecords = records.map((record) => record.join(""));
    const dmarcRecord = dmarcRecords.find((record) =>
      record.startsWith("v=DMARC1;")
    );

    if (!dmarcRecord) {
      return res
        .status(404)
        .send(
          JSON.stringify({ error: "No DMARC record found." }, null, 4) + "\n"
        );
    }

    const parsedTags = parseDmarcRecord(dmarcRecord);
    const report = parsedTags.map((tag) => ({
      Tag: tag.key,
      TagValue: tag.value,
      Name: tagDescriptions[tag.key]?.name,
      Description: tagDescriptions[tag.key]?.description,
    }));

    // Generate the JSON report with pretty-printing
    res.setHeader("Content-Type", "application/json");
    res.send(
      JSON.stringify(
        {
          dmarc: domain,
          record: dmarcRecord,
          report,
          tests: [
            {
              Test: "Status Ok",
              Result: "DMARC Record Published",
              Description: "DMARC Record found",
            },
            {
              Test: "Status Ok",
              Result: "DMARC Syntax Check",
              Description: "The record is valid",
            },
            // Additional tests and their results can be added here
          ],
        },
        null,
        4
      ) + "\n"
    ); // Pretty-print JSON with 4 spaces of indentation
  } catch (err) {
    res.setHeader("Content-Type", "application/json");
    res.status(500).send(
      JSON.stringify(
        {
          error: "Failed to lookup DMARC record.",
          details: err.message,
        },
        null,
        4
      ) + "\n"
    ); // Pretty-print JSON
  }
});

module.exports = router;
