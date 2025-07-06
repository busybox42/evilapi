const dns = require("dns").promises;
const { performance } = require("perf_hooks");
const logger = require('../utils/logger');

// Global DNS servers for propagation checking
const GLOBAL_DNS_SERVERS = [
  // Google Public DNS
  { name: "Google Primary", ip: "8.8.8.8", location: "Global" },
  { name: "Google Secondary", ip: "8.8.4.4", location: "Global" },
  
  // Cloudflare DNS
  { name: "Cloudflare Primary", ip: "1.1.1.1", location: "Global" },
  { name: "Cloudflare Secondary", ip: "1.0.0.1", location: "Global" },
  
  // OpenDNS
  { name: "OpenDNS Primary", ip: "208.67.222.222", location: "Global" },
  { name: "OpenDNS Secondary", ip: "208.67.220.220", location: "Global" },
  
  // Quad9
  { name: "Quad9 Primary", ip: "9.9.9.9", location: "Global" },
  { name: "Quad9 Secondary", ip: "149.112.112.112", location: "Global" },
  
  // Regional DNS servers
  { name: "Level3 Primary", ip: "4.2.2.1", location: "US" },
  { name: "Level3 Secondary", ip: "4.2.2.2", location: "US" },
  
  // International DNS servers
  { name: "Comodo Secure DNS", ip: "8.26.56.26", location: "Global" },
  { name: "Verisign Public DNS", ip: "64.6.64.6", location: "Global" },
  
  // Additional global servers
  { name: "Clean Browsing", ip: "185.228.168.9", location: "Global" },
  { name: "Neustar UltraDNS", ip: "156.154.70.1", location: "Global" },
  { name: "AdGuard DNS", ip: "94.140.14.14", location: "Global" }
];

/**
 * Query a specific DNS server for a record
 * @param {string} hostname - The hostname to query
 * @param {string} recordType - The record type (A, AAAA, MX, etc.)
 * @param {string} dnsServer - The DNS server IP to query
 * @returns {Promise<Object>} Query result with timing and data
 */
async function queryDnsServer(hostname, recordType, dnsServer) {
  const startTime = performance.now();
  
  try {
    // Set the DNS server for this query
    const resolver = new dns.Resolver();
    resolver.setServers([dnsServer]);
    
    let records;
    const type = recordType.toUpperCase();
    
    switch (type) {
      case 'A':
        records = await resolver.resolve4(hostname);
        break;
      case 'AAAA':
        records = await resolver.resolve6(hostname);
        break;
      case 'MX':
        records = await resolver.resolveMx(hostname);
        break;
      case 'TXT':
        records = await resolver.resolveTxt(hostname);
        break;
      case 'CNAME':
        records = await resolver.resolveCname(hostname);
        break;
      case 'NS':
        records = await resolver.resolveNs(hostname);
        break;
      case 'PTR':
        records = await resolver.resolvePtr(hostname);
        break;
      case 'SRV':
        records = await resolver.resolveSrv(hostname);
        break;
      case 'SOA':
        records = await resolver.resolveSoa(hostname);
        break;
      default:
        throw new Error(`Unsupported record type: ${recordType}`);
    }
    
    const endTime = performance.now();
    const responseTime = Math.round((endTime - startTime) * 100) / 100; // Round to 2 decimal places
    
    return {
      success: true,
      records,
      responseTime,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    const endTime = performance.now();
    const responseTime = Math.round((endTime - startTime) * 100) / 100;
    
    return {
      success: false,
      error: error.message,
      responseTime,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Check DNS propagation across multiple global DNS servers
 * @param {string} hostname - The hostname to check
 * @param {string} recordType - The record type to check (default: 'A')
 * @param {Array} customServers - Optional custom DNS servers to check
 * @returns {Promise<Object>} Propagation results
 */
async function checkDnsPropagation(hostname, recordType = 'A', customServers = []) {
  if (!hostname || typeof hostname !== 'string') {
    throw new Error('Hostname is required and must be a string');
  }
  
  // Validate hostname length
  if (hostname.length > 253) {
    throw new Error('Hostname too long (maximum 253 characters)');
  }
  
  // Validate hostname format (basic check for invalid characters)
  const invalidChars = /[^a-zA-Z0-9.-]/;
  if (invalidChars.test(hostname)) {
    throw new Error('Hostname contains invalid characters');
  }
  
  const recordTypes = ['A', 'AAAA', 'MX', 'TXT', 'CNAME', 'NS', 'PTR', 'SRV', 'SOA'];
  if (!recordTypes.includes(recordType.toUpperCase())) {
    throw new Error(`Invalid record type. Supported types: ${recordTypes.join(', ')}`);
  }
  
  // Combine global servers with custom servers
  const serversToCheck = [...GLOBAL_DNS_SERVERS];
  if (customServers && customServers.length > 0) {
    customServers.forEach((server, index) => {
      serversToCheck.push({
        name: `Custom Server ${index + 1}`,
        ip: server,
        location: "Custom"
      });
    });
  }
  
  logger.info(`Checking DNS propagation for ${hostname} (${recordType}) across ${serversToCheck.length} servers`);
  
  const startTime = performance.now();
  
  // Query all DNS servers in parallel
  const results = await Promise.all(
    serversToCheck.map(async (server) => {
      const result = await queryDnsServer(hostname, recordType, server.ip);
      return {
        server: server.name,
        ip: server.ip,
        location: server.location,
        ...result
      };
    })
  );
  
  const endTime = performance.now();
  const totalTime = Math.round((endTime - startTime) * 100) / 100;
  
  // Analyze results
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  const uniqueRecords = new Set();
  const recordValuesByServer = {};
  
  successful.forEach(result => {
    if (result.records) {
      // Normalize records for comparison
      const normalizedRecords = JSON.stringify(result.records);
      uniqueRecords.add(normalizedRecords);
      recordValuesByServer[result.server] = result.records;
    }
  });
  
  const propagationPercentage = Math.round((successful.length / results.length) * 100);
  const isFullyPropagated = failed.length === 0;
  const hasInconsistentRecords = uniqueRecords.size > 1;
  
  // Calculate average response time
  const avgResponseTime = successful.length > 0 
    ? Math.round((successful.reduce((sum, r) => sum + r.responseTime, 0) / successful.length) * 100) / 100
    : 0;
  
  return {
    hostname,
    recordType: recordType.toUpperCase(),
    timestamp: new Date().toISOString(),
    totalServers: results.length,
    successful: successful.length,
    failed: failed.length,
    propagationPercentage,
    isFullyPropagated,
    hasInconsistentRecords,
    uniqueRecordSets: uniqueRecords.size,
    averageResponseTime: avgResponseTime,
    totalQueryTime: totalTime,
    results,
    recordValuesByServer,
    summary: {
      status: isFullyPropagated ? 'FULLY_PROPAGATED' : 'PARTIAL_PROPAGATION',
      message: isFullyPropagated 
        ? 'DNS records are fully propagated across all servers'
        : `DNS records are propagated to ${propagationPercentage}% of servers (${successful.length}/${results.length})`,
      inconsistentRecords: hasInconsistentRecords ? 'Different record values found across servers' : 'Consistent record values'
    }
  };
}

/**
 * Get DNS propagation summary for multiple record types
 * @param {string} hostname - The hostname to check
 * @param {Array} recordTypes - Array of record types to check
 * @returns {Promise<Object>} Multi-record propagation summary
 */
async function checkMultiRecordPropagation(hostname, recordTypes = ['A', 'MX', 'TXT']) {
  if (!hostname || typeof hostname !== 'string') {
    throw new Error('Hostname is required and must be a string');
  }
  // Filter out AAAA from recordTypes
  recordTypes = (recordTypes || []).filter(type => type.toUpperCase() !== 'AAAA');
  
  const results = await Promise.all(
    recordTypes.map(async (recordType) => {
      try {
        const result = await checkDnsPropagation(hostname, recordType);
        // Consider propagation successful only if at least some servers responded successfully
        const success = result.successful > 0;
        // If no servers were successful, extract error from the first failed result
        let error = undefined;
        if (!success && result.failed > 0) {
          const firstFailure = result.results.find(r => !r.success);
          if (firstFailure) {
            error = firstFailure.error;
          }
        }
        // Normalize fields for frontend robustness
        return {
          recordType: result.recordType || recordType,
          hostname: result.hostname || hostname,
          timestamp: result.timestamp,
          success,
          successful: result.successful || 0,
          failed: result.failed || 0,
          totalServers: result.totalServers || (result.results ? result.results.length : 0),
          hasInconsistentRecords: !!result.hasInconsistentRecords,
          results: Array.isArray(result.results) ? result.results : [],
          recordValuesByServer: result.recordValuesByServer || {},
          error,
          summary: result.summary || {},
        };
      } catch (error) {
        return {
          recordType,
          hostname,
          timestamp: new Date().toISOString(),
          success: false,
          successful: 0,
          failed: 0,
          totalServers: 0,
          hasInconsistentRecords: false,
          results: [],
          recordValuesByServer: {},
          error: error.message,
          summary: {},
        };
      }
    })
  );
  
  const successful = results.filter(r => r.success === true);
  const failed = results.filter(r => r.success === false);
  
  // Determine if all record types are consistent
  const allConsistent = results.every(r => r.success && r.hasInconsistentRecords === false);
  let overallStatus;
  if (allConsistent) {
    overallStatus = 'ALL_CONSISTENT';
  } else if (failed.length === 0) {
    overallStatus = 'ALL_RECORDS_PROPAGATED';
  } else if (failed.length > 0 && successful.length > 0) {
    overallStatus = 'SOME_FAILED';
  } else {
    overallStatus = 'ALL_FAILED';
  }

  return {
    hostname,
    timestamp: new Date().toISOString(),
    recordTypes,
    results,
    summary: {
      totalTypes: recordTypes.length,
      successful: successful.length,
      failed: failed.length,
      overallStatus
    }
  };
}

module.exports = {
  checkDnsPropagation,
  checkMultiRecordPropagation,
  queryDnsServer,
  GLOBAL_DNS_SERVERS
}; 