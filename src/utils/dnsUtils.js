const dns = require("dns").promises;
const dnsSocket = require("dns-socket");
const socket = dnsSocket();

const isIpAddress = (host) => {
  return /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(
    host
  );
};

async function resolveDnsServer(dnsServer) {
  if (isIpAddress(dnsServer)) {
    return dnsServer; // Return the IP if dnsServer is already an IP address
  } else {
    try {
      // Attempt to resolve the hostname to an IP
      const addresses = await dns.lookup(dnsServer);
      return addresses.address;
    } catch (err) {
      // If the DNS server hostname cannot be resolved
      throw new Error(`Failed to resolve DNS server hostname: ${dnsServer}`);
    }
  }
}

async function dnsLookup(host, type = "A", dnsServer) {
  try {
    // Resolve the DNS server address if it's a hostname, or verify it's a valid IP
    const resolvedDnsServer = await resolveDnsServer(dnsServer);

    return new Promise((resolve, reject) => {
      const queryType = type || (isIpAddress(host) ? "PTR" : "A");

      socket.query(
        {
          questions: [
            {
              type: queryType,
              name: host,
            },
          ],
        },
        53,
        resolvedDnsServer,
        (err, res) => {
          if (err) {
            console.error("DNS Lookup Error:", err);
            reject(new Error("DNS Lookup Error"));
          } else {
            // Extract the addresses from the response
            const addresses = res.answers.map((answer) => answer.data);
            resolve({
              host,
              type: queryType,
              addresses,
              dnsServer: resolvedDnsServer,
            });
          }
        }
      );
    });
  } catch (error) {
    throw error; // This will be caught by the try-catch block in the route handler
  }
}

module.exports = dnsLookup;
