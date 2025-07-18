const dns = require("dns").promises;
const geoip = require("geoip-lite");
const whoisJson = require("whois-json");
const net = require("net");

function extractIPv4(ip) {
  // Check if the IP is in IPv4-mapped IPv6 format (::ffff:x.x.x.x)
  if (ip.indexOf("::ffff:") === 0) {
    return ip.substring(7);
  }
  return ip;
}

const whoamiService = {
  async getWhoamiData(ipAddressOrHostname) {
    // Extract IPv4 if it's an IPv4-mapped IPv6 address
    const processedInput = extractIPv4(ipAddressOrHostname);

    const whoamiInfo = {
      originalInput: ipAddressOrHostname,
      ip: processedInput,
      resolvedIp: null,
      geoInfo: null,
      ptrRecord: null,
      ispInfo: null,
    };

    // Check if the processed input is an IP address
    const isIpAddress = net.isIP(processedInput);
    let targetIp = processedInput;

    // If it's not an IP address, try to resolve it as a hostname
    if (!isIpAddress) {
      try {
        const addresses = await dns.resolve4(processedInput);
        if (addresses && addresses.length > 0) {
          targetIp = addresses[0];
          whoamiInfo.resolvedIp = targetIp;
        }
      } catch (error) {
        console.error("Error resolving hostname:", error.message);
        // If hostname resolution fails, still try WHOIS with original input
        targetIp = processedInput;
      }
    }

    // Update IP field to show resolved IP if available
    if (whoamiInfo.resolvedIp) {
      whoamiInfo.ip = whoamiInfo.resolvedIp;
    }

    // Geo location data (use resolved IP if available)
    if (net.isIP(targetIp)) {
      whoamiInfo.geoInfo = geoip.lookup(targetIp);
    }

    // PTR record (use resolved IP if available)
    if (net.isIP(targetIp)) {
      try {
        const ptrRecord = await dns.reverse(targetIp);
        whoamiInfo.ptrRecord = ptrRecord[0];
      } catch (error) {
        console.error("Error fetching PTR record:", error.message);
      }
    }

    // ISP info using WHOIS data (use resolved IP if available, otherwise original input)
    try {
      const whoisData = await whoisJson(targetIp);
      whoamiInfo.ispInfo = whoisData; // This will contain detailed WHOIS information, including ISP details
    } catch (error) {
      console.error("Error fetching WHOIS data:", error.message);
    }

    return whoamiInfo;
  },
};

module.exports = whoamiService;
