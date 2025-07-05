// Mock dns.promises module
jest.mock('dns', () => ({
  promises: {
    Resolver: jest.fn()
  }
}));

// Mock the logger
jest.mock('../../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
}));

const dns = require('dns').promises;
const logger = require('../../../src/utils/logger');
const {
  checkDnsPropagation,
  checkMultiRecordPropagation,
  queryDnsServer,
  GLOBAL_DNS_SERVERS
} = require('../../../src/services/dnsPropagationService');

describe('DNS Propagation Service', () => {
  let mockResolver;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create a mock resolver instance
    mockResolver = {
      setServers: jest.fn(),
      resolve4: jest.fn(),
      resolve6: jest.fn(),
      resolveMx: jest.fn(),
      resolveTxt: jest.fn(),
      resolveCname: jest.fn(),
      resolveNs: jest.fn(),
      resolvePtr: jest.fn(),
      resolveSrv: jest.fn(),
      resolveSoa: jest.fn()
    };

    // Mock the Resolver constructor
    dns.Resolver.mockImplementation(() => mockResolver);
  });

  describe('GLOBAL_DNS_SERVERS', () => {
    test('should contain expected DNS servers', () => {
      expect(GLOBAL_DNS_SERVERS).toBeDefined();
      expect(Array.isArray(GLOBAL_DNS_SERVERS)).toBe(true);
      expect(GLOBAL_DNS_SERVERS.length).toBeGreaterThan(10);
      
      // Check that all servers have required properties
      GLOBAL_DNS_SERVERS.forEach(server => {
        expect(server).toHaveProperty('name');
        expect(server).toHaveProperty('ip');
        expect(server).toHaveProperty('location');
        expect(typeof server.name).toBe('string');
        expect(typeof server.ip).toBe('string');
        expect(typeof server.location).toBe('string');
      });
    });

    test('should include Google DNS servers', () => {
      const googleServers = GLOBAL_DNS_SERVERS.filter(server => 
        server.name.includes('Google')
      );
      expect(googleServers.length).toBeGreaterThanOrEqual(2);
    });

    test('should include Cloudflare DNS servers', () => {
      const cloudflareServers = GLOBAL_DNS_SERVERS.filter(server => 
        server.name.includes('Cloudflare')
      );
      expect(cloudflareServers.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('queryDnsServer', () => {
    test('should successfully query A records', async () => {
      const mockRecords = ['93.184.216.34'];
      mockResolver.resolve4.mockResolvedValue(mockRecords);

      const result = await queryDnsServer('example.com', 'A', '8.8.8.8');

      expect(mockResolver.setServers).toHaveBeenCalledWith(['8.8.8.8']);
      expect(mockResolver.resolve4).toHaveBeenCalledWith('example.com');
      expect(result.success).toBe(true);
      expect(result.records).toEqual(mockRecords);
      expect(result.responseTime).toBeGreaterThan(0);
      expect(result.timestamp).toBeDefined();
    });

    test('should successfully query MX records', async () => {
      const mockRecords = [{ exchange: 'mail.example.com', priority: 10 }];
      mockResolver.resolveMx.mockResolvedValue(mockRecords);

      const result = await queryDnsServer('example.com', 'MX', '8.8.8.8');

      expect(mockResolver.resolveMx).toHaveBeenCalledWith('example.com');
      expect(result.success).toBe(true);
      expect(result.records).toEqual(mockRecords);
    });

    test('should handle DNS query errors', async () => {
      const mockError = new Error('NXDOMAIN');
      mockResolver.resolve4.mockRejectedValue(mockError);

      const result = await queryDnsServer('nonexistent.example.com', 'A', '8.8.8.8');

      expect(result.success).toBe(false);
      expect(result.error).toBe('NXDOMAIN');
      expect(result.responseTime).toBeGreaterThan(0);
      expect(result.timestamp).toBeDefined();
    });

    test('should handle unsupported record types', async () => {
      const result = await queryDnsServer('example.com', 'INVALID', '8.8.8.8');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unsupported record type: INVALID');
    });

    test('should query different record types correctly', async () => {
      const testCases = [
        { type: 'AAAA', method: 'resolve6' },
        { type: 'TXT', method: 'resolveTxt' },
        { type: 'CNAME', method: 'resolveCname' },
        { type: 'NS', method: 'resolveNs' },
        { type: 'PTR', method: 'resolvePtr' },
        { type: 'SRV', method: 'resolveSrv' },
        { type: 'SOA', method: 'resolveSoa' }
      ];

      for (const testCase of testCases) {
        mockResolver[testCase.method].mockResolvedValue(['mock-result']);
        
        const result = await queryDnsServer('example.com', testCase.type, '8.8.8.8');
        
        expect(mockResolver[testCase.method]).toHaveBeenCalledWith('example.com');
        expect(result.success).toBe(true);
        
        jest.clearAllMocks();
      }
    });
  });

  describe('checkDnsPropagation', () => {
    test('should validate hostname parameter', async () => {
      await expect(checkDnsPropagation()).rejects.toThrow('Hostname is required and must be a string');
      await expect(checkDnsPropagation(123)).rejects.toThrow('Hostname is required and must be a string');
      await expect(checkDnsPropagation('')).rejects.toThrow('Hostname is required and must be a string');
    });

    test('should validate record type parameter', async () => {
      await expect(checkDnsPropagation('example.com', 'INVALID')).rejects.toThrow('Invalid record type');
    });

    test('should perform propagation check with successful results', async () => {
      const mockRecords = ['93.184.216.34'];
      mockResolver.resolve4.mockResolvedValue(mockRecords);

      const result = await checkDnsPropagation('example.com', 'A');

      expect(result.hostname).toBe('example.com');
      expect(result.recordType).toBe('A');
      expect(result.totalServers).toBe(GLOBAL_DNS_SERVERS.length);
      expect(result.successful).toBe(GLOBAL_DNS_SERVERS.length);
      expect(result.failed).toBe(0);
      expect(result.propagationPercentage).toBe(100);
      expect(result.isFullyPropagated).toBe(true);
      expect(result.hasInconsistentRecords).toBe(false);
      expect(result.results).toHaveLength(GLOBAL_DNS_SERVERS.length);
      expect(logger.info).toHaveBeenCalled();
    });

    test('should handle partial propagation', async () => {
      let callCount = 0;
      mockResolver.resolve4.mockImplementation(() => {
        callCount++;
        // Fail half of the requests
        if (callCount <= GLOBAL_DNS_SERVERS.length / 2) {
          return Promise.resolve(['93.184.216.34']);
        } else {
          return Promise.reject(new Error('NXDOMAIN'));
        }
      });

      const result = await checkDnsPropagation('example.com', 'A');

      expect(result.isFullyPropagated).toBe(false);
      expect(result.propagationPercentage).toBeLessThan(100);
      expect(result.failed).toBeGreaterThan(0);
      expect(result.summary.status).toBe('PARTIAL_PROPAGATION');
    });

    test('should detect inconsistent records', async () => {
      let callCount = 0;
      mockResolver.resolve4.mockImplementation(() => {
        callCount++;
        // Return different IPs for different servers
        if (callCount % 2 === 0) {
          return Promise.resolve(['93.184.216.34']);
        } else {
          return Promise.resolve(['93.184.216.35']);
        }
      });

      const result = await checkDnsPropagation('example.com', 'A');

      expect(result.hasInconsistentRecords).toBe(true);
      expect(result.uniqueRecordSets).toBeGreaterThan(1);
      expect(result.summary.inconsistentRecords).toBe('Different record values found across servers');
    });

    test('should include custom DNS servers', async () => {
      mockResolver.resolve4.mockResolvedValue(['93.184.216.34']);
      const customServers = ['1.1.1.1', '9.9.9.9'];

      const result = await checkDnsPropagation('example.com', 'A', customServers);

      expect(result.totalServers).toBe(GLOBAL_DNS_SERVERS.length + customServers.length);
      
      // Check that custom servers are included in results
      const customServerResults = result.results.filter(r => r.location === 'Custom');
      expect(customServerResults).toHaveLength(customServers.length);
    });

    test('should calculate average response time correctly', async () => {
      mockResolver.resolve4.mockResolvedValue(['93.184.216.34']);

      const result = await checkDnsPropagation('example.com', 'A');

      expect(result.averageResponseTime).toBeGreaterThan(0);
      expect(typeof result.averageResponseTime).toBe('number');
    });
  });

  describe('checkMultiRecordPropagation', () => {
    test('should validate hostname parameter', async () => {
      await expect(checkMultiRecordPropagation()).rejects.toThrow('Hostname is required and must be a string');
      await expect(checkMultiRecordPropagation(123)).rejects.toThrow('Hostname is required and must be a string');
    });

    test('should check multiple record types', async () => {
      mockResolver.resolve4.mockResolvedValue(['93.184.216.34']);
      mockResolver.resolve6.mockResolvedValue(['2606:2800:220:1:248:1893:25c8:1946']);
      mockResolver.resolveMx.mockResolvedValue([{ exchange: 'mail.example.com', priority: 10 }]);
      mockResolver.resolveTxt.mockResolvedValue([['v=spf1 include:_spf.google.com ~all']]);

      const result = await checkMultiRecordPropagation('example.com', ['A', 'AAAA', 'MX', 'TXT']);

      expect(result.hostname).toBe('example.com');
      expect(result.recordTypes).toEqual(['A', 'AAAA', 'MX', 'TXT']);
      expect(result.results).toHaveLength(4);
      expect(result.summary.totalTypes).toBe(4);
      expect(result.summary.successful).toBe(4);
      expect(result.summary.failed).toBe(0);
      expect(result.summary.overallStatus).toBe('ALL_RECORDS_PROPAGATED');
    });

    test('should handle failures for some record types', async () => {
      // Clear all mocks first
      jest.clearAllMocks();
      
      // Mock A record success - all servers return the same result
      mockResolver.resolve4.mockResolvedValue(['93.184.216.34']);
      
      // Mock MX record failure - all servers fail
      mockResolver.resolveMx.mockRejectedValue(new Error('No MX records'));

      const result = await checkMultiRecordPropagation('example.com', ['A', 'MX']);

      expect(result.summary.successful).toBe(1);
      expect(result.summary.failed).toBe(1);
      expect(result.summary.overallStatus).toBe('SOME_RECORDS_FAILED');
      
      // Check that failed record has error information
      const failedResult = result.results.find(r => r.success === false);
      expect(failedResult).toBeDefined();
      expect(failedResult.recordType).toBe('MX');
      expect(failedResult.error).toBe('No MX records');
    });

    test('should use default record types when none specified', async () => {
      mockResolver.resolve4.mockResolvedValue(['93.184.216.34']);
      mockResolver.resolve6.mockResolvedValue(['2606:2800:220:1:248:1893:25c8:1946']);
      mockResolver.resolveMx.mockResolvedValue([{ exchange: 'mail.example.com', priority: 10 }]);
      mockResolver.resolveTxt.mockResolvedValue([['v=spf1 include:_spf.google.com ~all']]);

      const result = await checkMultiRecordPropagation('example.com');

      expect(result.recordTypes).toEqual(['A', 'AAAA', 'MX', 'TXT']);
      expect(result.results).toHaveLength(4);
    });
  });

  describe('performance and timing', () => {
    test('should measure response times accurately', async () => {
      // Mock a delay in DNS resolution
      mockResolver.resolve4.mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => resolve(['93.184.216.34']), 10);
        });
      });

      const result = await queryDnsServer('example.com', 'A', '8.8.8.8');

      expect(result.responseTime).toBeGreaterThan(9);
      expect(result.responseTime).toBeLessThan(100); // Should be reasonable
    });

    test('should track total query time for propagation check', async () => {
      mockResolver.resolve4.mockResolvedValue(['93.184.216.34']);

      const result = await checkDnsPropagation('example.com', 'A');

      expect(result.totalQueryTime).toBeGreaterThan(0);
      expect(typeof result.totalQueryTime).toBe('number');
    });
  });

  describe('edge cases', () => {
    test('should handle empty DNS responses', async () => {
      mockResolver.resolve4.mockResolvedValue([]);

      const result = await queryDnsServer('example.com', 'A', '8.8.8.8');

      expect(result.success).toBe(true);
      expect(result.records).toEqual([]);
    });

    test('should handle very large hostnames', async () => {
      const longHostname = 'a'.repeat(300) + '.example.com';
      
      await expect(checkDnsPropagation(longHostname)).rejects.toThrow();
    });

    test('should handle special characters in hostnames', async () => {
      await expect(checkDnsPropagation('ex@mple.com')).rejects.toThrow();
      await expect(checkDnsPropagation('example$.com')).rejects.toThrow();
    });
  });
}); 