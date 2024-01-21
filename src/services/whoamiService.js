const dns = require("dns").promises;
const geoip = require("geoip-lite");
const whoisJson = require("whois-json");
const net = require("net");

const whoamiService = {
  async getWhoamiData(ipAddressOrHostname) {
    const whoamiInfo = {
      ip: ipAddressOrHostname,
      geoInfo: null,
      ptrRecord: null,
      ispInfo: null,
    };

    // Check if the input is an IP address
    const isIpAddress = net.isIP(ipAddressOrHostname);

    // Geo location data
    if (isIpAddress) {
      whoamiInfo.geoInfo = geoip.lookup(ipAddressOrHostname);
    }

    // PTR record (only if it's an IP address)
    if (isIpAddress) {
      try {
        const ptrRecord = await dns.reverse(ipAddressOrHostname);
        whoamiInfo.ptrRecord = ptrRecord[0];
      } catch (error) {
        console.error("Error fetching PTR record:", error.message);
      }
    }

    // ISP info using WHOIS data (for both IP addresses and hostnames)
    try {
      const whoisData = await whoisJson(ipAddressOrHostname);
      whoamiInfo.ispInfo = whoisData; // This will contain detailed WHOIS information, including ISP details
    } catch (error) {
      console.error("Error fetching WHOIS data:", error.message);
    }

    return whoamiInfo;
  },
};

module.exports = whoamiService;
