const dns = require("dns").promises;

const isIpAddress = (host) => {
  return /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(
    host
  );
};

async function dnsLookup(host, type = "A", dnsServer) {
  try {
    // Set the DNS server if specified
    if (dnsServer && isIpAddress(dnsServer)) {
      dns.setServers([dnsServer]);
    }

    const queryType = type || (isIpAddress(host) ? "PTR" : "A");
    const addresses = await dns.resolve(host, queryType);
    return { host, type: queryType, addresses, dnsServer };
  } catch (err) {
    console.error("DNS Lookup Error:", err);
    throw err;
  }
}

module.exports = dnsLookup;
