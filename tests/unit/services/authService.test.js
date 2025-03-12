// Mock the authUtils module
jest.mock('../../../src/utils/authUtils', () => ({
  authPop3: jest.fn(),
  authImap: jest.fn(),
  authSmtp: jest.fn(),
  authFtp: jest.fn()
}));

const { authService } = require('../../../src/services/authService');
const { authPop3, authImap, authSmtp, authFtp } = require('../../../src/utils/authUtils');

describe('Auth Service', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test('should call authPop3 for POP3 protocol', async () => {
    // Arrange
    const username = 'testuser';
    const password = 'testpass';
    const hostname = 'mail.example.com';
    const protocol = 'pop3';
    const expectedResult = { success: true, protocol: 'POP3' };
    
    authPop3.mockResolvedValue(expectedResult);

    // Act
    const result = await authService(username, password, hostname, protocol);

    // Assert
    expect(authPop3).toHaveBeenCalledWith(username, password, hostname, protocol);
    expect(result).toEqual(expectedResult);
  });

  test('should call authPop3 for POP3S protocol', async () => {
    // Arrange
    const username = 'testuser';
    const password = 'testpass';
    const hostname = 'mail.example.com';
    const protocol = 'pop3s';
    const expectedResult = { success: true, protocol: 'POP3S' };
    
    authPop3.mockResolvedValue(expectedResult);

    // Act
    const result = await authService(username, password, hostname, protocol);

    // Assert
    expect(authPop3).toHaveBeenCalledWith(username, password, hostname, protocol);
    expect(result).toEqual(expectedResult);
  });

  test('should call authImap for IMAP protocol', async () => {
    // Arrange
    const username = 'testuser';
    const password = 'testpass';
    const hostname = 'mail.example.com';
    const protocol = 'imap';
    const expectedResult = { success: true, protocol: 'IMAP' };
    
    authImap.mockResolvedValue(expectedResult);

    // Act
    const result = await authService(username, password, hostname, protocol);

    // Assert
    expect(authImap).toHaveBeenCalledWith(username, password, hostname, protocol);
    expect(result).toEqual(expectedResult);
  });

  test('should call authImap for IMAPS protocol', async () => {
    // Arrange
    const username = 'testuser';
    const password = 'testpass';
    const hostname = 'mail.example.com';
    const protocol = 'imaps';
    const expectedResult = { success: true, protocol: 'IMAPS' };
    
    authImap.mockResolvedValue(expectedResult);

    // Act
    const result = await authService(username, password, hostname, protocol);

    // Assert
    expect(authImap).toHaveBeenCalledWith(username, password, hostname, protocol);
    expect(result).toEqual(expectedResult);
  });

  test('should call authSmtp for SMTP protocol', async () => {
    // Arrange
    const username = 'testuser';
    const password = 'testpass';
    const hostname = 'mail.example.com';
    const protocol = 'smtp';
    const expectedResult = { success: true, protocol: 'SMTP' };
    
    authSmtp.mockResolvedValue(expectedResult);

    // Act
    const result = await authService(username, password, hostname, protocol);

    // Assert
    expect(authSmtp).toHaveBeenCalledWith(username, password, hostname, protocol);
    expect(result).toEqual(expectedResult);
  });

  test('should call authSmtp for SMTPS protocol', async () => {
    // Arrange
    const username = 'testuser';
    const password = 'testpass';
    const hostname = 'mail.example.com';
    const protocol = 'smtps';
    const expectedResult = { success: true, protocol: 'SMTPS' };
    
    authSmtp.mockResolvedValue(expectedResult);

    // Act
    const result = await authService(username, password, hostname, protocol);

    // Assert
    expect(authSmtp).toHaveBeenCalledWith(username, password, hostname, protocol);
    expect(result).toEqual(expectedResult);
  });

  test('should call authSmtp for SUBMISSION protocol', async () => {
    // Arrange
    const username = 'testuser';
    const password = 'testpass';
    const hostname = 'mail.example.com';
    const protocol = 'submission';
    const expectedResult = { success: true, protocol: 'SUBMISSION' };
    
    authSmtp.mockResolvedValue(expectedResult);

    // Act
    const result = await authService(username, password, hostname, protocol);

    // Assert
    expect(authSmtp).toHaveBeenCalledWith(username, password, hostname, protocol);
    expect(result).toEqual(expectedResult);
  });

  test('should call authFtp for FTP protocol', async () => {
    // Arrange
    const username = 'testuser';
    const password = 'testpass';
    const hostname = 'ftp.example.com';
    const protocol = 'ftp';
    const expectedResult = { success: true, protocol: 'FTP' };
    
    authFtp.mockResolvedValue(expectedResult);

    // Act
    const result = await authService(username, password, hostname, protocol);

    // Assert
    expect(authFtp).toHaveBeenCalledWith(username, password, hostname, protocol);
    expect(result).toEqual(expectedResult);
  });

  test('should call authFtp for SFTP protocol', async () => {
    // Arrange
    const username = 'testuser';
    const password = 'testpass';
    const hostname = 'sftp.example.com';
    const protocol = 'sftp';
    const expectedResult = { success: true, protocol: 'SFTP' };
    
    authFtp.mockResolvedValue(expectedResult);

    // Act
    const result = await authService(username, password, hostname, protocol);

    // Assert
    expect(authFtp).toHaveBeenCalledWith(username, password, hostname, protocol);
    expect(result).toEqual(expectedResult);
  });

  test('should throw error for unsupported protocol', async () => {
    // Arrange
    const username = 'testuser';
    const password = 'testpass';
    const hostname = 'example.com';
    const protocol = 'unsupported';

    // Act & Assert
    await expect(authService(username, password, hostname, protocol))
      .rejects
      .toThrow('Unsupported protocol');
  });
}); 