// Mock the dependencies
jest.mock('dns', () => ({
  promises: {
    reverse: jest.fn(),
    resolve4: jest.fn()
  }
}));

jest.mock('geoip-lite', () => ({
  lookup: jest.fn()
}));

jest.mock('whois-json', () => jest.fn());

const dns = require('dns').promises;
const geoip = require('geoip-lite');
const whoisJson = require('whois-json');
const whoamiService = require('../../../src/services/whoamiService');

describe('Whoami Service', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test('should process IPv4 address correctly', async () => {
    // Arrange
    const ipAddress = '192.168.1.1';
    const mockGeoData = {
      country: 'US',
      region: 'CA',
      city: 'San Francisco'
    };
    const mockPtrRecord = ['example.com'];
    const mockWhoisData = {
      orgName: 'Example ISP',
      netRange: '192.168.0.0 - 192.168.255.255'
    };

    geoip.lookup.mockReturnValue(mockGeoData);
    dns.reverse.mockResolvedValue(mockPtrRecord);
    whoisJson.mockResolvedValue(mockWhoisData);

    // Act
    const result = await whoamiService.getWhoamiData(ipAddress);

    // Assert
    expect(result.originalInput).toBe(ipAddress);
    expect(result.ip).toBe(ipAddress);
    expect(result.resolvedIp).toBeNull();
    expect(result.geoInfo).toEqual(mockGeoData);
    expect(result.ptrRecord).toBe(mockPtrRecord[0]);
    expect(result.ispInfo).toEqual(mockWhoisData);
    expect(geoip.lookup).toHaveBeenCalledWith(ipAddress);
    expect(dns.reverse).toHaveBeenCalledWith(ipAddress);
    expect(whoisJson).toHaveBeenCalledWith(ipAddress);
  });

  test('should handle IPv4-mapped IPv6 address', async () => {
    // Arrange
    const ipv6Address = '::ffff:192.168.1.1';
    const ipv4Address = '192.168.1.1';
    const mockGeoData = {
      country: 'US',
      region: 'CA',
      city: 'San Francisco'
    };
    const mockPtrRecord = ['example.com'];
    const mockWhoisData = {
      orgName: 'Example ISP',
      netRange: '192.168.0.0 - 192.168.255.255'
    };

    geoip.lookup.mockReturnValue(mockGeoData);
    dns.reverse.mockResolvedValue(mockPtrRecord);
    whoisJson.mockResolvedValue(mockWhoisData);

    // Act
    const result = await whoamiService.getWhoamiData(ipv6Address);

    // Assert
    expect(result.originalInput).toBe(ipv6Address);
    expect(result.ip).toBe(ipv4Address);
    expect(result.resolvedIp).toBeNull();
    expect(result.geoInfo).toEqual(mockGeoData);
    expect(result.ptrRecord).toBe(mockPtrRecord[0]);
    expect(result.ispInfo).toEqual(mockWhoisData);
    expect(geoip.lookup).toHaveBeenCalledWith(ipv4Address);
    expect(dns.reverse).toHaveBeenCalledWith(ipv4Address);
    expect(whoisJson).toHaveBeenCalledWith(ipv4Address);
  });

  test('should handle hostname with DNS resolution', async () => {
    // Arrange
    const hostname = 'example.com';
    const resolvedIp = '93.184.216.34';
    const mockGeoData = {
      country: 'US',
      region: 'MA',
      city: 'Norwood'
    };
    const mockPtrRecord = ['example.com'];
    const mockWhoisData = {
      domainName: 'example.com',
      registrar: 'Example Registrar'
    };

    dns.resolve4.mockResolvedValue([resolvedIp]);
    geoip.lookup.mockReturnValue(mockGeoData);
    dns.reverse.mockResolvedValue(mockPtrRecord);
    whoisJson.mockResolvedValue(mockWhoisData);

    // Act
    const result = await whoamiService.getWhoamiData(hostname);

    // Assert
    expect(result.originalInput).toBe(hostname);
    expect(result.ip).toBe(resolvedIp);
    expect(result.resolvedIp).toBe(resolvedIp);
    expect(result.geoInfo).toEqual(mockGeoData);
    expect(result.ptrRecord).toBe(mockPtrRecord[0]);
    expect(result.ispInfo).toEqual(mockWhoisData);
    expect(dns.resolve4).toHaveBeenCalledWith(hostname);
    expect(geoip.lookup).toHaveBeenCalledWith(resolvedIp);
    expect(dns.reverse).toHaveBeenCalledWith(resolvedIp);
    expect(whoisJson).toHaveBeenCalledWith(resolvedIp);
  });

  test('should handle hostname with DNS resolution failure', async () => {
    // Arrange
    const hostname = 'nonexistent.example.com';
    const mockWhoisData = {
      domainName: 'nonexistent.example.com',
      registrar: 'Example Registrar'
    };

    dns.resolve4.mockRejectedValue(new Error('DNS resolution failed'));
    geoip.lookup.mockReturnValue(null);
    whoisJson.mockResolvedValue(mockWhoisData);

    // Spy on console.error
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    // Act
    const result = await whoamiService.getWhoamiData(hostname);

    // Assert
    expect(result.originalInput).toBe(hostname);
    expect(result.ip).toBe(hostname);
    expect(result.resolvedIp).toBeNull();
    expect(result.geoInfo).toBeNull();
    expect(result.ptrRecord).toBeNull();
    expect(result.ispInfo).toEqual(mockWhoisData);
    expect(dns.resolve4).toHaveBeenCalledWith(hostname);
    expect(geoip.lookup).not.toHaveBeenCalled();
    expect(dns.reverse).not.toHaveBeenCalled();
    expect(whoisJson).toHaveBeenCalledWith(hostname);
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error resolving hostname:', 'DNS resolution failed');
    
    // Restore console.error
    consoleErrorSpy.mockRestore();
  });

  test('should handle errors in PTR lookup', async () => {
    // Arrange
    const ipAddress = '192.168.1.1';
    const mockGeoData = {
      country: 'US',
      region: 'CA',
      city: 'San Francisco'
    };
    const mockWhoisData = {
      orgName: 'Example ISP',
      netRange: '192.168.0.0 - 192.168.255.255'
    };

    geoip.lookup.mockReturnValue(mockGeoData);
    dns.reverse.mockRejectedValue(new Error('DNS error'));
    whoisJson.mockResolvedValue(mockWhoisData);

    // Spy on console.error
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    // Act
    const result = await whoamiService.getWhoamiData(ipAddress);

    // Assert
    expect(result.originalInput).toBe(ipAddress);
    expect(result.ip).toBe(ipAddress);
    expect(result.resolvedIp).toBeNull();
    expect(result.geoInfo).toEqual(mockGeoData);
    expect(result.ptrRecord).toBeNull();
    expect(result.ispInfo).toEqual(mockWhoisData);
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching PTR record:', 'DNS error');
    
    // Restore console.error
    consoleErrorSpy.mockRestore();
  });

  test('should handle errors in WHOIS lookup', async () => {
    // Arrange
    const ipAddress = '192.168.1.1';
    const mockGeoData = {
      country: 'US',
      region: 'CA',
      city: 'San Francisco'
    };
    const mockPtrRecord = ['example.com'];

    geoip.lookup.mockReturnValue(mockGeoData);
    dns.reverse.mockResolvedValue(mockPtrRecord);
    whoisJson.mockRejectedValue(new Error('WHOIS error'));

    // Spy on console.error
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    // Act
    const result = await whoamiService.getWhoamiData(ipAddress);

    // Assert
    expect(result.originalInput).toBe(ipAddress);
    expect(result.ip).toBe(ipAddress);
    expect(result.resolvedIp).toBeNull();
    expect(result.geoInfo).toEqual(mockGeoData);
    expect(result.ptrRecord).toBe(mockPtrRecord[0]);
    expect(result.ispInfo).toBeNull();
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching WHOIS data:', 'WHOIS error');
    
    // Restore console.error
    consoleErrorSpy.mockRestore();
  });
}); 