const hashService = require('../../../src/services/hashService');

describe('Hash Service', () => {
  describe('createHash', () => {
    test('should hash a string using MD5', async () => {
      const algorithm = 'md5';
      const text = 'test';
      const expectedHash = '098f6bcd4621d373cade4e832627b4f6';
      
      const result = await hashService.createHash(algorithm, text);
      
      expect(result).toBe(expectedHash);
    });
    
    test('should hash a string using SHA256', async () => {
      const algorithm = 'sha256';
      const text = 'test';
      const expectedHash = '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08';
      
      const result = await hashService.createHash(algorithm, text);
      
      expect(result).toBe(expectedHash);
    });
    
    test('should throw an error for unsupported algorithm', async () => {
      const algorithm = 'unsupported-algorithm';
      const text = 'test';
      
      await expect(hashService.createHash(algorithm, text))
        .rejects
        .toThrow(`The specified algorithm "${algorithm}" is not supported.`);
    });
    
    test('should handle empty string', async () => {
      const algorithm = 'sha256';
      const text = '';
      const expectedHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
      
      const result = await hashService.createHash(algorithm, text);
      
      expect(result).toBe(expectedHash);
    });
  });
}); 