const dns = require("dns").promises;

async function checkDnsbl(ip, dnsbl) {
  if (typeof ip !== "string") {
    console.error(`Invalid IP: ${ip}`);
    return { listed: false, details: `Invalid IP: ${ip}` };
  }

  try {
    await dns.resolve(`${ip.split(".").reverse().join(".")}.${dnsbl.host}`);
    return { listed: true, details: dnsbl.details };
  } catch (err) {
    if (err.code === "ENOTFOUND") {
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
    { host: "dnsbl.invaluement.com", details: "Invaluement" },
    { host: "dnswl.dnsbl.net.au", details: "DNS Whitelist" },
    { host: "psbl.surriel.com", details: "Passive Spam Block List" },
    { host: "bl.mailspike.net", details: "Mailspike" },
    { host: "cbl.abuseat.org", details: "Composite Blocking List (CBL)" },
    { host: "dul.dnsbl.sorbs.net", details: "SORBS DUL" },
    { host: "spam.dnsbl.sorbs.net", details: "SORBS SPAM" },
    { host: "pbl.spamhaus.org", details: "Policy Block List (PBL)" },
    { host: "db.wpbl.info", details: "WPBL - Weighted Private Block List" },
    { host: "tor.dan.me.uk", details: "TOR Exit Nodes" },
    { host: "ubl.unsubscore.com", details: "Unsubscribe Blacklist" },
    { host: "bl.konstant.no", details: "Konstant Blacklist" },
    { host: "z.mailspike.net", details: "Mailspike Zero-hour" },
    { host: "relays.bl.gweep.ca", details: "Gweep.net Relay Check" },
    { host: "sorbs.dnsbl.net.au", details: "SORBS DNSBL (Australia)" },
    { host: "ivm-uri.spamhaus.org", details: "ivmURI" },
    { host: "dbl.nordspam.com", details: "Nordspam DBL" },
    { host: "fresh.spameatingmonkey.net", details: "SEM FRESH" },
    { host: "uri.spameatingmonkey.net", details: "SEM URI" },
    { host: "urired.spameatingmonkey.net", details: "SEM URIRED" },
    { host: "badconf.rhsbl.sorbs.net", details: "SORBS RHSBL BADCONF" },
    { host: "nomail.rhsbl.sorbs.net", details: "SORBS RHSBL NOMAIL" },
    { host: "dbl.spamhaus.org", details: "Spamhaus DBL" },
    { host: "multi.surbl.org", details: "SURBL multi" },
    { host: "0spam.lashback.com", details: "0SPAM" },
    { host: "0spam.rbl.msrbl.net", details: "0SPAM RBL" },
    { host: "abuse.ro", details: "Abuse.ro" },
    { host: "anonmails.rfc-ignorant.org", details: "Anonmails DNSBL" },
    { host: "blackholes.five-ten-sg.com", details: "BACKSCATTERER" },
    { host: "b.barracudacentral.org", details: "BARRACUDA" },
    { host: "dnsbl-1.blocklist.de", details: "BLOCKLIST.DE" },
    { host: "calivent.com", details: "CALIVENT" },
    { host: "bogons.cymru.com", details: "CYMRU BOGONS" },
    { host: "tor.dnsbl.sectoor.de", details: "DAN TOR" },
    { host: "torexit.dnsbl.sectoor.de", details: "DAN TOREXIT" },
    { host: "dnsbl.madavi.de", details: "DNS SERVICIOS" },
    { host: "dnsbl.dronebl.org", details: "DRMX" },
    { host: "dnsbl.dronebl.org", details: "DRONE BL" },
    { host: "rbl.fabel.dk", details: "FABELSOURCES" },
    { host: "hil.habeas.com", details: "HIL" },
    { host: "hil.habeas.com", details: "HIL2" },
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
