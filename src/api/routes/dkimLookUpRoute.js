const express = require("express");
const dns = require("dns").promises; // Using the Promise-based DNS module
const router = express.Router();

// Set the DNS server to Google Public DNS
dns.setServers(["8.8.8.8"]);

/**
 * Validates a DKIM record's syntax and returns validation results and errors.
 * @param {string} dkimRecord - The DKIM record string.
 * @returns {object} An object containing isValid (boolean) and errors (array of strings).
 */
const validateDkimRecord = (dkimRecord) => {
  let errors = [];
  let isValid = true;

  if (typeof dkimRecord !== "string") {
    isValid = false;
    errors.push("DKIM record is not a valid string.");
    return { isValid, errors };
  }

  if (!dkimRecord.startsWith("v=DKIM1;")) {
    isValid = false;
    errors.push("Not a DKIM record.");
    return { isValid, errors };
  }

  if (!dkimRecord.includes("p=")) {
    isValid = false;
    errors.push("Missing required public key tag 'p='.");
  }

  return { isValid, errors };
};

/**
 * API endpoint to lookup and validate DKIM records for a given domain and selector.
 */
router.get("/lookup-dkim", async (req, res) => {
  const domain = req.query.domain;
  const selector = req.query.selector;

  if (!domain || !selector) {
    return res.status(400).json({
      error: "Both domain and selector query parameters are required.",
    });
  }

  const dkimRecordName = `${selector}._domainkey.${domain}`;

  try {
    const records = await dns.resolveTxt(dkimRecordName);
    const dkimRecords = records.map((record) => record.join(""));

    const dkimRecordFound = dkimRecords.some((record) =>
      record.startsWith("v=DKIM1;")
    );

    if (!dkimRecordFound) {
      const prettyJson = JSON.stringify(
        {
          error: "No DKIM records found.",
          lookedUp: dkimRecordName, // Include the looked-up record name
        },
        null,
        4
      );
      res.setHeader("Content-Type", "application/json");
      return res.status(404).send(prettyJson + "\n");
    }

    const validationResults = dkimRecords.map(validateDkimRecord);
    const validRecords = validationResults.filter((result) => result.isValid);

    if (validRecords.length > 0) {
      const validDkimRecords = dkimRecords.filter(
        (_, index) => validationResults[index].isValid
      );

      const prettyJson = JSON.stringify(
        {
          message: "Valid DKIM records found:",
          records: validDkimRecords, // Return the valid DKIM records
          lookedUp: dkimRecordName, // Include the looked-up record name
        },
        null,
        4
      );
      res.setHeader("Content-Type", "application/json");
      return res.send(prettyJson + "\n");
    } else {
      const prettyJson = JSON.stringify(
        {
          error: "DKIM record syntax errors found:",
          details: validationResults.flatMap((result) => result.errors), // Show all errors if no valid records
          lookedUp: dkimRecordName, // Include the looked-up record name
        },
        null,
        4
      );
      res.setHeader("Content-Type", "application/json");
      return res.status(400).send(prettyJson + "\n");
    }
  } catch (err) {
    const prettyJson = JSON.stringify(
      {
        error: "Failed to lookup DKIM record.",
        details: err.message,
        lookedUp: dkimRecordName, // Include the looked-up record name in case of failure
      },
      null,
      4
    );
    res.setHeader("Content-Type", "application/json");
    res.status(500).send(prettyJson + "\n");
  }
});

module.exports = router;
