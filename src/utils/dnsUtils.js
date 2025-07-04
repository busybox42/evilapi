const dns = require("dns").promises;
const logger = require('./logger');

// DNS resolution timeout (5 seconds)
const DNS_TIMEOUT = 5000;

// Set DNS timeout
dns.setDefaultResultOrder = 'ipv4first';

// Helper function to check if a hostname exists
const checkHostname = async (hostname) => {
  try {
    await dns.resolve(hostname);
    return true;
  } catch (error) {
    logger.debug(`Hostname ${hostname} not found: ${error.message}`);
    return false;
  }
};

// Resolve MX records with error handling
const resolveMx = async (domain) => {
  try {
    const records = await dns.resolveMx(domain);
    return records;
  } catch (error) {
    logger.debug(`MX lookup failed for ${domain}: ${error.message}`);
    return null;
  }
};

// Resolve TXT records with error handling
const resolveTxt = async (domain) => {
  try {
    const records = await dns.resolveTxt(domain);
    return records;
  } catch (error) {
    logger.debug(`TXT lookup failed for ${domain}: ${error.message}`);
    return null;
  }
};

// Resolve A records with error handling
const resolveA = async (domain) => {
  try {
    const records = await dns.resolve(domain);
    return records;
  } catch (error) {
    logger.debug(`A record lookup failed for ${domain}: ${error.message}`);
    return null;
  }
};

// Get SPF records from TXT records
const getSpfRecords = async (domain) => {
  try {
    const txtRecords = await resolveTxt(domain);
    if (!txtRecords) return null;
    
    const spfRecords = txtRecords
      .filter(record => record.join("").startsWith("v=spf1"))
      .map(record => record.join(""));
    
    return spfRecords.length > 0 ? spfRecords : null;
  } catch (error) {
    logger.debug(`SPF lookup failed for ${domain}: ${error.message}`);
    return null;
  }
};

// Get DMARC records
const getDmarcRecords = async (domain) => {
  try {
    const dmarcDomain = `_dmarc.${domain}`;
    const txtRecords = await resolveTxt(dmarcDomain);
    if (!txtRecords) return null;
    
    const dmarcRecords = txtRecords
      .filter(record => record.join("").startsWith("v=DMARC1"))
      .map(record => record.join(""));
    
    return dmarcRecords.length > 0 ? dmarcRecords : null;
  } catch (error) {
    logger.debug(`DMARC lookup failed for ${domain}: ${error.message}`);
    return null;
  }
};

// Get BIMI records
const getBimiRecords = async (domain) => {
  try {
    const bimiDomain = `default._bimi.${domain}`;
    const txtRecords = await resolveTxt(bimiDomain);
    if (!txtRecords) return null;
    
    const bimiRecords = txtRecords
      .filter(record => record.join("").startsWith("v=BIMI1"))
      .map(record => record.join(""));
    
    return bimiRecords.length > 0 ? bimiRecords : null;
  } catch (error) {
    logger.debug(`BIMI lookup failed for ${domain}: ${error.message}`);
    return null;
  }
};

// Get DKIM records
const getDkimRecords = async (domain, selector) => {
  try {
    const dkimDomain = `${selector}._domainkey.${domain}`;
    const txtRecords = await resolveTxt(dkimDomain);
    if (!txtRecords) return null;
    
    const dkimRecords = txtRecords
      .filter(record => record.join("").includes("v=DKIM1"))
      .map(record => record.join(""));
    
    return dkimRecords.length > 0 ? dkimRecords : null;
  } catch (error) {
    logger.debug(`DKIM lookup failed for ${selector}._domainkey.${domain}: ${error.message}`);
    return null;
  }
};

// Check email client hostnames
const checkEmailClientSettings = async (domain) => {
  const emailClientHostnames = [
    `mail.${domain}`,
    `pop.${domain}`,
    `pop3.${domain}`,
    `imap.${domain}`,
    `smtp.${domain}`
  ];

  const results = await Promise.all(
    emailClientHostnames.map(hostname => checkHostname(hostname))
  );

  return emailClientHostnames.filter((hostname, index) => results[index]);
};

// Comprehensive email info lookup
const getEmailInfo = async (domain) => {
  try {
    const emailInfo = {};

    // Parallel DNS queries for better performance
    const [
      mxRecords,
      spfRecords,
      dmarcRecords,
      bimiRecords,
      aRecords,
      clientSettings
    ] = await Promise.all([
      resolveMx(domain),
      getSpfRecords(domain),
      getDmarcRecords(domain),
      getBimiRecords(domain),
      resolveA(domain),
      checkEmailClientSettings(domain)
    ]);

    // Only include non-null results
    if (mxRecords) emailInfo.mxRecords = mxRecords;
    if (spfRecords) emailInfo.spfRecord = spfRecords;
    if (dmarcRecords) emailInfo.dmarcRecord = dmarcRecords;
    if (bimiRecords) emailInfo.bimiRecord = bimiRecords;
    if (aRecords) emailInfo.aRecord = aRecords;
    if (clientSettings && clientSettings.length > 0) {
      emailInfo.clientSettings = clientSettings;
    }

    return emailInfo;
  } catch (error) {
    logger.error(`Email info lookup failed for ${domain}: ${error.message}`);
    throw error;
  }
};

// Check if domain/IP is on blacklist
const checkBlacklist = async (identifier, blacklistHosts) => {
  const results = [];
  
  for (const dnsbl of blacklistHosts) {
    try {
      let queryHost;
      
      // Handle IP addresses (reverse for DNSBL lookup)
      if (/^\d+\.\d+\.\d+\.\d+$/.test(identifier)) {
        queryHost = `${identifier.split(".").reverse().join(".")}.${dnsbl.host}`;
      } else {
        // Handle domains
        queryHost = `${identifier}.${dnsbl.host}`;
      }
      
      await dns.resolve(queryHost);
      results.push({
        blacklist: dnsbl.name,
        host: dnsbl.host,
        listed: true,
        queryHost
      });
    } catch (error) {
      // Not listed (expected for most queries)
      results.push({
        blacklist: dnsbl.name,
        host: dnsbl.host,
        listed: false
      });
    }
  }
  
  return results;
};

// Main DNS lookup function for different record types
const dnsLookup = async (host, type = 'A', dnsServer = null) => {
  try {
    // Set custom DNS server if provided
    if (dnsServer) {
      dns.setServers([dnsServer]);
    }

    const recordType = type.toUpperCase();
    let results;

    switch (recordType) {
      case 'A':
        results = await dns.resolve4(host);
        break;
      case 'AAAA':
        results = await dns.resolve6(host);
        break;
      case 'MX':
        results = await dns.resolveMx(host);
        break;
      case 'TXT':
        results = await dns.resolveTxt(host);
        break;
      case 'CNAME':
        results = await dns.resolveCname(host);
        break;
      case 'NS':
        results = await dns.resolveNs(host);
        break;
      case 'PTR':
        results = await dns.resolvePtr(host);
        break;
      case 'SRV':
        results = await dns.resolveSrv(host);
        break;
      case 'SOA':
        results = await dns.resolveSoa(host);
        break;
      case 'LOC':
        // LOC records are not directly supported, use ANY and filter
        try {
          results = await dns.resolveAny(host);
          results = results.filter(record => record.type === 'LOC');
        } catch (error) {
          throw new Error(`LOC records not found for ${host}`);
        }
        break;
      default:
        throw new Error(`Unsupported DNS record type: ${type}`);
    }

    return {
      host,
      type: recordType,
      records: results,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    logger.error(`DNS lookup failed for ${host} (${type}): ${error.message}`);
    throw new Error(`DNS lookup failed: ${error.message}`);
  } finally {
    // Reset to default DNS servers
    if (dnsServer) {
      dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
    }
  }
};

module.exports = {
  dnsLookup,
  checkHostname,
  resolveMx,
  resolveTxt,
  resolveA,
  getSpfRecords,
  getDmarcRecords,
  getBimiRecords,
  getDkimRecords,
  checkEmailClientSettings,
  getEmailInfo,
  checkBlacklist
};
