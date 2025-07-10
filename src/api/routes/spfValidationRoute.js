const express = require("express");
const dns = require("dns").promises;
const router = express.Router();

/**
 * Joins split TXT records into a single record
 * @param {string[]} records - Array of TXT records
 * @returns {string} - Joined record
 */
const joinSplitRecords = (records) => {
  // Remove any quotes at the end/beginning of records
  return records.map(record => record.replace(/^"|"$/g, '')).join('');
};

/**
 * Fetches and validates SPF record for a domain, including following redirects
 * @param {string} domain - Domain to check
 * @param {Set<string>} visitedDomains - Set of domains already checked (for redirect loop detection)
 * @returns {Promise<Object>} - Validation results
 */
const fetchAndValidateSpf = async (domain, visitedDomains = new Set()) => {
  if (visitedDomains.has(domain)) {
    return {
      isValid: false,
      errors: ["Redirect loop detected"],
      warnings: [],
      mechanisms: [],
      record: null,
      lookedUp: Array.from(visitedDomains).join(" -> ")
    };
  }

  visitedDomains.add(domain);

  try {
    const records = await dns.resolveTxt(domain);
    const spfRecords = records
      .map((record) => record.join(""))
      .filter((record) => record.toLowerCase().startsWith("v=spf1"));

    if (spfRecords.length === 0) {
      return {
        isValid: false,
        errors: ["No SPF records found"],
        warnings: [],
        mechanisms: [],
        record: null,
        lookedUp: domain,
        rawRecords: records.map(r => r.join(""))
      };
    }

    // Handle split TXT records
    let spfRecord;
    if (spfRecords.length > 1) {
      // Check if these are split records or multiple distinct records
      const firstRecord = spfRecords[0].toLowerCase();
      const hasRedirect = firstRecord.includes("redirect=");
      const isComplete = firstRecord.includes("all");

      if (!hasRedirect && !isComplete) {
        // Likely split records, try to join them
        spfRecord = joinSplitRecords(spfRecords);
      } else {
        return {
          isValid: false,
          errors: ["Multiple distinct SPF records found"],
          warnings: [],
          mechanisms: [],
          record: null,
          lookedUp: domain,
          records: spfRecords
        };
      }
    } else {
      spfRecord = spfRecords[0];
    }

    // Check for redirect
    const redirectMatch = spfRecord.match(/\sredirect=([^\s]+)/i);
    if (redirectMatch) {
      const redirectDomain = redirectMatch[1];
      // Follow the redirect
      const redirectResult = await fetchAndValidateSpf(redirectDomain, visitedDomains);
      return {
        ...redirectResult,
        redirectChain: Array.from(visitedDomains)
      };
    }

    // Validate the record
    const validationResults = validateSpfRecord(spfRecord);
    return {
      ...validationResults,
      record: spfRecord,
      lookedUp: domain,
      redirectChain: visitedDomains.size > 1 ? Array.from(visitedDomains) : undefined
    };
  } catch (error) {
    return {
      isValid: false,
      errors: [`Failed to lookup SPF record: ${error.message}`],
      warnings: [],
      mechanisms: [],
      record: null,
      lookedUp: domain
    };
  }
};

/**
 * Validates an SPF record's syntax and returns validation results and errors.
 * @param {string} spfRecord - The SPF record string.
 * @returns {Object} - Validation results including errors and warnings.
 */
const validateSpfRecord = (spfRecord) => {
  const errors = [];
  const warnings = [];
  const mechanisms = [];

  // Basic validation
  if (typeof spfRecord !== "string") {
    errors.push("SPF record is not a valid string.");
    return { isValid: false, errors, warnings, mechanisms };
  }

  // Must start with v=spf1
  if (!spfRecord.toLowerCase().startsWith("v=spf1")) {
    errors.push("Not a valid SPF record. Must start with 'v=spf1'.");
    return { isValid: false, errors, warnings, mechanisms };
  }

  // Split into mechanisms
  const parts = spfRecord.split(" ").filter(part => part.length > 0);
  
  // Track qualifiers and mechanisms
  let hasAll = false;
  let allLocation = -1;
  const seenMechanisms = new Set();

  parts.forEach((part, index) => {
    if (index === 0 && part.toLowerCase() !== "v=spf1") {
      errors.push("First part must be 'v=spf1'");
      return;
    }

    if (index === 0) return; // Skip v=spf1

    // Check qualifier
    let mechanism = part;
    let qualifier = "+"; // Default qualifier
    if (["+", "-", "~", "?"].includes(part[0])) {
      qualifier = part[0];
      mechanism = part.substring(1);
    }

    // Validate mechanism
    const mechanismType = mechanism.split(":")[0].toLowerCase();
    
    if (mechanismType === "all") {
      hasAll = true;
      allLocation = index;
      if (index !== parts.length - 1) {
        errors.push("'all' mechanism must be the last mechanism in the record");
      }
    }

    // Check for valid mechanisms
    const validMechanisms = ["all", "include", "a", "mx", "ptr", "ip4", "ip6", "exists", "redirect"];
    if (!validMechanisms.includes(mechanismType)) {
      errors.push(`Invalid mechanism: ${mechanismType}`);
    }

    // Check for duplicate mechanisms
    if (seenMechanisms.has(mechanismType)) {
      warnings.push(`Duplicate mechanism: ${mechanismType}`);
    }
    seenMechanisms.add(mechanismType);

    // Store mechanism details
    mechanisms.push({
      qualifier,
      type: mechanismType,
      value: mechanism.includes(":") ? mechanism.split(":")[1] : null,
      fullText: part
    });
  });

  // Check for missing 'all' mechanism
  if (!hasAll) {
    warnings.push("No 'all' mechanism found. This is recommended as an explicit default policy.");
  }

  // Check record length (DNS TXT record limit is 255 characters)
  if (spfRecord.length > 255) {
    warnings.push("SPF record exceeds 255 characters. The record appears to be split across multiple TXT records, which is valid but may cause issues with some email systems.");
  }

  // Check number of DNS lookups (limit is 10)
  const lookupMechanisms = mechanisms.filter(m => 
    ["include", "a", "mx", "exists", "ptr", "redirect"].includes(m.type)
  );
  if (lookupMechanisms.length > 10) {
    errors.push("SPF record contains more than 10 DNS lookups, which exceeds the limit.");
  }

  // Warn about ptr usage
  if (seenMechanisms.has("ptr")) {
    warnings.push("Use of 'ptr' mechanism is discouraged due to performance impact.");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    mechanisms,
    hasAll,
    allLocation
  };
};

/**
 * API endpoint to lookup and validate SPF records for a given domain.
 */
router.get("/validate-spf", async (req, res) => {
  const { domain } = req.query;

  if (!domain) {
    return res.status(400).json({
      error: "Domain parameter is required.",
    });
  }

  try {
    const results = await fetchAndValidateSpf(domain);

    if (results.isValid && results.warnings.length === 0) {
      return res.json({
        message: "Valid SPF record found:",
        ...results
      });
    } else if (results.isValid) {
      return res.json({
        message: "Valid SPF record found with warnings:",
        ...results
      });
    } else {
      return res.status(400).json({
        error: "SPF record validation failed:",
        ...results
      });
    }
  } catch (error) {
    return res.status(500).json({
      error: "Failed to lookup SPF record.",
      message: error.message,
      lookedUp: domain,
    });
  }
});

module.exports = router; 