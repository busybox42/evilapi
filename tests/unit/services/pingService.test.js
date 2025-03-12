// Mock the child_process module
jest.mock('child_process', () => ({
  exec: jest.fn()
}));

// Mock the os module
jest.mock('os', () => ({
  platform: jest.fn()
}));

const { exec } = require('child_process');
const os = require('os');
const { pingHost, tracerouteHost } = require('../../../src/services/pingService');

describe('Ping Service', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });
  
  describe('pingHost', () => {
    test('should resolve with stdout on successful ping', async () => {
      // Arrange
      const host = 'example.com';
      const mockStdout = 'PING example.com (93.184.216.34): 56 data bytes\n64 bytes from 93.184.216.34: icmp_seq=0 ttl=56 time=11.632 ms\n';
      
      // Mock the exec function to call the callback with success
      exec.mockImplementation((command, callback) => {
        callback(null, mockStdout, '');
      });
      
      // Act
      const result = await pingHost(host);
      
      // Assert
      expect(result).toBe(mockStdout);
      expect(exec).toHaveBeenCalledWith(`ping -c 4 ${host}`, expect.any(Function));
    });
    
    test('should reject with error message on ping error', async () => {
      // Arrange
      const host = 'nonexistent.example.com';
      const mockError = new Error('Command failed');
      
      // Mock the exec function to call the callback with an error
      exec.mockImplementation((command, callback) => {
        callback(mockError, '', '');
      });
      
      // Act & Assert
      await expect(pingHost(host)).rejects.toEqual(`Ping error: ${mockError.message}`);
      expect(exec).toHaveBeenCalledWith(`ping -c 4 ${host}`, expect.any(Function));
    });
    
    test('should reject with stderr message when stderr is present', async () => {
      // Arrange
      const host = 'example.com';
      const mockStderr = 'Some error occurred';
      
      // Mock the exec function to call the callback with stderr
      exec.mockImplementation((command, callback) => {
        callback(null, '', mockStderr);
      });
      
      // Act & Assert
      await expect(pingHost(host)).rejects.toEqual(`Ping stderr: ${mockStderr}`);
      expect(exec).toHaveBeenCalledWith(`ping -c 4 ${host}`, expect.any(Function));
    });
  });
  
  describe('tracerouteHost', () => {
    test('should use traceroute command on non-Windows platforms', async () => {
      // Arrange
      const host = 'example.com';
      const mockStdout = 'traceroute to example.com (93.184.216.34), 30 hops max, 60 byte packets\n';
      
      // Mock os.platform to return 'linux'
      os.platform.mockReturnValue('linux');
      
      // Mock the exec function to call the callback with success
      exec.mockImplementation((command, callback) => {
        callback(null, mockStdout, '');
      });
      
      // Act
      const result = await tracerouteHost(host);
      
      // Assert
      expect(result).toBe(mockStdout);
      expect(os.platform).toHaveBeenCalled();
      expect(exec).toHaveBeenCalledWith(`traceroute ${host}`, expect.any(Function));
    });
    
    test('should use tracert command on Windows platform', async () => {
      // Arrange
      const host = 'example.com';
      const mockStdout = 'Tracing route to example.com [93.184.216.34]\nover a maximum of 30 hops:\n';
      
      // Mock os.platform to return 'win32'
      os.platform.mockReturnValue('win32');
      
      // Mock the exec function to call the callback with success
      exec.mockImplementation((command, callback) => {
        callback(null, mockStdout, '');
      });
      
      // Act
      const result = await tracerouteHost(host);
      
      // Assert
      expect(result).toBe(mockStdout);
      expect(os.platform).toHaveBeenCalled();
      expect(exec).toHaveBeenCalledWith(`tracert ${host}`, expect.any(Function));
    });
    
    test('should reject with error message on traceroute error', async () => {
      // Arrange
      const host = 'nonexistent.example.com';
      const mockError = new Error('Command failed');
      
      // Mock os.platform to return 'linux'
      os.platform.mockReturnValue('linux');
      
      // Mock the exec function to call the callback with an error
      exec.mockImplementation((command, callback) => {
        callback(mockError, '', '');
      });
      
      // Act & Assert
      await expect(tracerouteHost(host)).rejects.toEqual(`Traceroute error: ${mockError.message}`);
      expect(exec).toHaveBeenCalledWith(`traceroute ${host}`, expect.any(Function));
    });
    
    test('should reject with stderr message when stderr is present', async () => {
      // Arrange
      const host = 'example.com';
      const mockStderr = 'Some error occurred';
      
      // Mock os.platform to return 'linux'
      os.platform.mockReturnValue('linux');
      
      // Mock the exec function to call the callback with stderr
      exec.mockImplementation((command, callback) => {
        callback(null, '', mockStderr);
      });
      
      // Act & Assert
      await expect(tracerouteHost(host)).rejects.toEqual(`Traceroute stderr: ${mockStderr}`);
      expect(exec).toHaveBeenCalledWith(`traceroute ${host}`, expect.any(Function));
    });
  });
}); 