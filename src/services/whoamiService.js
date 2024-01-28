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
    const processedIp = extractIPv4(ipAddressOrHostname);

    const whoamiInfo = {
      ip: processedIp,
      geoInfo: null,
      ptrRecord: null,
      ispInfo: null,
    };

    // Check if the processed IP is an IP address
    const isIpAddress = net.isIP(processedIp);

    // Geo location data
    if (isIpAddress) {
      whoamiInfo.geoInfo = geoip.lookup(processedIp);
    }

    // PTR record (only if it's an IP address)
    if (isIpAddress) {
      try {
        const ptrRecord = await dns.reverse(processedIp);
        whoamiInfo.ptrRecord = ptrRecord[0];
      } catch (error) {
        console.error("Error fetching PTR record:", error.message);
      }
    }

    // ISP info using WHOIS data (for both IP addresses and hostnames)
    try {
      const whoisData = await whoisJson(processedIp);
      whoamiInfo.ispInfo = whoisData; // This will contain detailed WHOIS information, including ISP details
    } catch (error) {
      console.error("Error fetching WHOIS data:", error.message);
    }

    return whoamiInfo;
  },
};

module.exports = whoamiService;
