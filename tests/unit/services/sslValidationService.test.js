// Mock the https module
jest.mock('https', () => ({
  request: jest.fn()
}));

const https = require('https');
const { validateSSL } = require('../../../src/services/sslValidationService');

describe('SSL Validation Service', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });
  
  test('should resolve with valid certificate details', async () => {
    // Arrange
    const hostname = 'example.com';
    const port = 443;
    
    // Create mock certificate data
    const mockCertificate = {
      subject: { CN: 'example.com' },
      issuer: { O: 'Let\'s Encrypt', CN: 'R3' },
      valid_from: '2023-01-01T00:00:00.000Z',
      valid_to: '2024-01-01T00:00:00.000Z',
      serialNumber: '12345678',
      sigalg: 'sha256WithRSAEncryption',
      subjectaltname: 'DNS:example.com, DNS:www.example.com'
    };
    
    // Mock the request function
    const mockRequest = {
      on: jest.fn(),
      end: jest.fn()
    };
    
    https.request.mockImplementation((options, callback) => {
      // Create a mock response with socket containing certificate
      const mockResponse = {
        socket: {
          authorized: true,
          getPeerCertificate: () => mockCertificate
        }
      };
      
      // Call the callback with the mock response
      callback(mockResponse);
      
      return mockRequest;
    });
    
    // Act
    const result = await validateSSL(hostname, port);
    
    // Assert
    expect(result).toEqual({
      valid: true,
      details: {
        subject: mockCertificate.subject,
        issuer: mockCertificate.issuer,
        validFrom: mockCertificate.valid_from,
        validTo: mockCertificate.valid_to,
        serialNumber: mockCertificate.serialNumber,
        algorithm: mockCertificate.sigalg,
        alternativeHostnames: ['example.com', 'www.example.com']
      }
    });
    
    expect(https.request).toHaveBeenCalledWith(
      {
        hostname,
        port,
        agent: false,
        rejectUnauthorized: false,
        ciphers: 'ALL'
      },
      expect.any(Function)
    );
    
    expect(mockRequest.on).toHaveBeenCalledWith('error', expect.any(Function));
    expect(mockRequest.end).toHaveBeenCalled();
  });
  
  test('should resolve with valid certificate details without alternative hostnames', async () => {
    // Arrange
    const hostname = 'example.com';
    const port = 443;
    
    // Create mock certificate data without subjectaltname
    const mockCertificate = {
      subject: { CN: 'example.com' },
      issuer: { O: 'Let\'s Encrypt', CN: 'R3' },
      valid_from: '2023-01-01T00:00:00.000Z',
      valid_to: '2024-01-01T00:00:00.000Z',
      serialNumber: '12345678',
      sigalg: 'sha256WithRSAEncryption'
    };
    
    // Mock the request function
    const mockRequest = {
      on: jest.fn(),
      end: jest.fn()
    };
    
    https.request.mockImplementation((options, callback) => {
      // Create a mock response with socket containing certificate
      const mockResponse = {
        socket: {
          authorized: true,
          getPeerCertificate: () => mockCertificate
        }
      };
      
      // Call the callback with the mock response
      callback(mockResponse);
      
      return mockRequest;
    });
    
    // Act
    const result = await validateSSL(hostname, port);
    
    // Assert
    expect(result).toEqual({
      valid: true,
      details: {
        subject: mockCertificate.subject,
        issuer: mockCertificate.issuer,
        validFrom: mockCertificate.valid_from,
        validTo: mockCertificate.valid_to,
        serialNumber: mockCertificate.serialNumber,
        algorithm: mockCertificate.sigalg
      }
    });
    
    // Verify that alternativeHostnames is not present
    expect(result.details.alternativeHostnames).toBeUndefined();
  });
  
  test('should resolve with invalid status when certificate is not authorized', async () => {
    // Arrange
    const hostname = 'example.com';
    const port = 443;
    
    // Create mock certificate data
    const mockCertificate = {
      subject: { CN: 'example.com' },
      issuer: { O: 'Let\'s Encrypt', CN: 'R3' },
      valid_from: '2023-01-01T00:00:00.000Z',
      valid_to: '2024-01-01T00:00:00.000Z',
      serialNumber: '12345678',
      sigalg: 'sha256WithRSAEncryption'
    };
    
    // Mock the request function
    const mockRequest = {
      on: jest.fn(),
      end: jest.fn()
    };
    
    https.request.mockImplementation((options, callback) => {
      // Create a mock response with socket containing certificate but not authorized
      const mockResponse = {
        socket: {
          authorized: false,
          getPeerCertificate: () => mockCertificate
        }
      };
      
      // Call the callback with the mock response
      callback(mockResponse);
      
      return mockRequest;
    });
    
    // Act
    const result = await validateSSL(hostname, port);
    
    // Assert
    expect(result.valid).toBe(false);
    expect(result.details).toBeDefined();
  });
  
  test('should resolve with invalid status when certificate is missing', async () => {
    // Arrange
    const hostname = 'example.com';
    const port = 443;
    
    // Mock the request function
    const mockRequest = {
      on: jest.fn(),
      end: jest.fn()
    };
    
    https.request.mockImplementation((options, callback) => {
      // Create a mock response with socket but no certificate
      const mockResponse = {
        socket: {
          authorized: false,
          getPeerCertificate: () => ({})
        }
      };
      
      // Call the callback with the mock response
      callback(mockResponse);
      
      return mockRequest;
    });
    
    // Act
    const result = await validateSSL(hostname, port);
    
    // Assert
    expect(result).toEqual({ valid: false });
  });
  
  test('should reject when request encounters an error', async () => {
    // Arrange
    const hostname = 'example.com';
    const port = 443;
    const mockError = new Error('Connection refused');
    
    // Mock the request function
    const mockRequest = {
      on: jest.fn(),
      end: jest.fn()
    };
    
    https.request.mockImplementation((options, callback) => {
      return mockRequest;
    });
    
    // Mock the error event
    mockRequest.on.mockImplementation((event, callback) => {
      if (event === 'error') {
        callback(mockError);
      }
      return mockRequest;
    });
    
    // Act & Assert
    await expect(validateSSL(hostname, port)).rejects.toEqual(mockError);
    expect(mockRequest.end).toHaveBeenCalled();
  });
}); 