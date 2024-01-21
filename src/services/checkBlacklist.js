const dns = require("dns").promises;

async function checkDnsbl(ip, dnsbl) {
  if (typeof ip !== "string") {
    console.error(`Invalid IP: ${ip}`);
    return { listed: false, details: `Invalid IP: ${ip}` };
  }

  try {
    await dns.resolve(`${ip.split(".").reverse().join(".")}.${dnsbl.host}`);
    console.log(`IP ${ip} is listed in ${dnsbl.host}`); // Debug log for a listed result
    return { listed: true, details: dnsbl.details };
  } catch (err) {
    if (err.code === "ENOTFOUND") {
      console.log(`IP ${ip} is not listed in ${dnsbl.host}`); // Debug log for a not listed result
      return { listed: false };
    } else {
      throw err;
    }
  }
}

async function checkBlacklist(ip) {
  const dnsblList = [
    { host: "zen.spamhaus.org", details: "Spamhaus Zen" },
    { host: "b.barracudacentral.org", details: "Barracuda Networks" },
    { host: "bl.spamcop.net", details: "Spam Cop" },
    { host: "dnsbl.sorbs.net", details: "SORBS" },
    { host: "dnsbl-1.uceprotect.net", details: "UCEProtect 1" },
    { host: "dnsbl-2.uceprotect.net", details: "UCEProtect 2" },
    { host: "dnsbl-3.uceprotect.net", details: "UCEProtect 3" },
    { host: "ips.backscatterer.org", details: "UCEProtect IPS" },
    { host: "multi.surbl.org", details: "SURBL" },
    // Add more DNSBL services here
  ];

  const results = await Promise.all(
    dnsblList.map((dnsbl) => checkDnsbl(ip, dnsbl))
  );

  // Map the results to include RBL details and listing status
  const formattedResults = results.map((result, index) => ({
    rbl: dnsblList[index].details,
    listed: result.listed,
  }));

  return formattedResults;
}

module.exports = { checkBlacklist };
