const base64Service = require('../../../src/services/base64Service');

describe('Base64 Service', () => {
  describe('encode', () => {
    test('should encode a string to base64', () => {
      const input = 'Hello, World!';
      const expectedOutput = 'SGVsbG8sIFdvcmxkIQ==';
      
      const result = base64Service.encode(input);
      
      expect(result).toBe(expectedOutput);
    });
    
    test('should handle empty string', () => {
      const input = '';
      const expectedOutput = '';
      
      const result = base64Service.encode(input);
      
      expect(result).toBe(expectedOutput);
    });
    
    test('should handle special characters', () => {
      const input = '!@#$%^&*()_+';
      const expectedOutput = 'IUAjJCVeJiooKV8r';
      
      const result = base64Service.encode(input);
      
      expect(result).toBe(expectedOutput);
    });
  });
  
  describe('decode', () => {
    test('should decode a base64 string', () => {
      const input = 'SGVsbG8sIFdvcmxkIQ==';
      const expectedOutput = 'Hello, World!';
      
      const result = base64Service.decode(input);
      
      expect(result).toBe(expectedOutput);
    });
    
    test('should handle empty string', () => {
      const input = '';
      const expectedOutput = '';
      
      const result = base64Service.decode(input);
      
      expect(result).toBe(expectedOutput);
    });
    
    test('should handle special characters', () => {
      const input = 'IUAjJCVeJiooKV8r';
      const expectedOutput = '!@#$%^&*()_+';
      
      const result = base64Service.decode(input);
      
      expect(result).toBe(expectedOutput);
    });
  });
}); 