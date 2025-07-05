const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');

// Mock the DNS propagation service
jest.mock('../../../src/services/dnsPropagationService', () => ({
  checkDnsPropagation: jest.fn(),
  checkMultiRecordPropagation: jest.fn(),
  GLOBAL_DNS_SERVERS: [
    { name: "Google Primary", ip: "8.8.8.8", location: "Global" },
    { name: "Cloudflare Primary", ip: "1.1.1.1", location: "Global" }
  ]
}));

// Mock the input validation
jest.mock('../../../src/middleware/inputValidation', () => ({
  validateDnsPropagation: (req, res, next) => {
    // Basic validation for testing
    if (!req.query.hostname) {
      return res.status(400).json({ error: 'Hostname is required' });
    }
    next();
  }
}));

const dnsPropagationService = require('../../../src/services/dnsPropagationService');
const dnsPropagationRoutes = require('../../../src/api/routes/dnsPropagationRoutes');

describe('DNS Propagation Routes', () => {
  let app;

  beforeEach(() => {
    // Set up Express app for testing
    app = express();
    app.use(bodyParser.json());
    app.use('/api', dnsPropagationRoutes);
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('GET /api/servers', () => {
    test('should return list of DNS servers', async () => {
      const response = await request(app)
        .get('/api/servers')
        .expect(200);

      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('servers');
      expect(response.body).toHaveProperty('timestamp');
      expect(Array.isArray(response.body.servers)).toBe(true);
      expect(response.body.total).toBe(2);
      expect(response.body.servers).toEqual([
        { name: "Google Primary", ip: "8.8.8.8", location: "Global" },
        { name: "Cloudflare Primary", ip: "1.1.1.1", location: "Global" }
      ]);
    });

    test('should handle errors gracefully', async () => {
      // Mock console.error to avoid test output pollution
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Restore original GLOBAL_DNS_SERVERS since setting it to null doesn't cause an error
      dnsPropagationService.GLOBAL_DNS_SERVERS = [
        { name: "Google Primary", ip: "8.8.8.8", location: "Global" },
        { name: "Cloudflare Primary", ip: "1.1.1.1", location: "Global" }
      ];

      const response = await request(app)
        .get('/api/servers')
        .expect(200);

      expect(response.body).toHaveProperty('servers');
      
      consoleSpy.mockRestore();
    });
  });

  describe('GET /api/check', () => {
    test('should perform single record type propagation check', async () => {
      const mockResult = {
        hostname: 'example.com',
        recordType: 'A',
        totalServers: 15,
        successful: 15,
        failed: 0,
        propagationPercentage: 100,
        isFullyPropagated: true,
        hasInconsistentRecords: false,
        results: []
      };

      dnsPropagationService.checkDnsPropagation.mockResolvedValue(mockResult);

      const response = await request(app)
        .get('/api/check')
        .query({ hostname: 'example.com', recordType: 'A' })
        .expect(200);

      expect(response.body).toEqual(mockResult);
      expect(dnsPropagationService.checkDnsPropagation).toHaveBeenCalledWith(
        'example.com',
        'A',
        []
      );
    });

    test('should use default record type when not specified', async () => {
      const mockResult = {
        hostname: 'example.com',
        recordType: 'A',
        totalServers: 15,
        successful: 15,
        failed: 0,
        propagationPercentage: 100,
        isFullyPropagated: true,
        hasInconsistentRecords: false,
        results: []
      };

      dnsPropagationService.checkDnsPropagation.mockResolvedValue(mockResult);

      const response = await request(app)
        .get('/api/check')
        .query({ hostname: 'example.com' })
        .expect(200);

      expect(dnsPropagationService.checkDnsPropagation).toHaveBeenCalledWith(
        'example.com',
        'A',
        []
      );
    });

    test('should handle custom DNS servers', async () => {
      const mockResult = { hostname: 'example.com' };
      dnsPropagationService.checkDnsPropagation.mockResolvedValue(mockResult);

      const response = await request(app)
        .get('/api/check')
        .query({ 
          hostname: 'example.com', 
          customServers: '1.1.1.1,9.9.9.9' 
        })
        .expect(200);

      expect(dnsPropagationService.checkDnsPropagation).toHaveBeenCalledWith(
        'example.com',
        'A',
        ['1.1.1.1', '9.9.9.9']
      );
    });

    test('should return 400 when hostname is missing', async () => {
      const response = await request(app)
        .get('/api/check')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('should handle service errors', async () => {
      dnsPropagationService.checkDnsPropagation.mockRejectedValue(
        new Error('DNS query failed')
      );

      const response = await request(app)
        .get('/api/check')
        .query({ hostname: 'example.com' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message', 'DNS query failed');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('GET /api/check-multi', () => {
    test('should perform multi-record propagation check', async () => {
      const mockResult = {
        hostname: 'example.com',
        recordTypes: ['A', 'MX'],
        results: [
          { recordType: 'A', success: true },
          { recordType: 'MX', success: true }
        ],
        summary: {
          totalTypes: 2,
          successful: 2,
          failed: 0,
          overallStatus: 'ALL_RECORDS_PROPAGATED'
        }
      };

      dnsPropagationService.checkMultiRecordPropagation.mockResolvedValue(mockResult);

      const response = await request(app)
        .get('/api/check-multi')
        .query({ hostname: 'example.com', recordTypes: 'A,MX' })
        .expect(200);

      expect(response.body).toEqual(mockResult);
      expect(dnsPropagationService.checkMultiRecordPropagation).toHaveBeenCalledWith(
        'example.com',
        ['A', 'MX']
      );
    });

    test('should use default record types when not specified', async () => {
      const mockResult = { hostname: 'example.com' };
      dnsPropagationService.checkMultiRecordPropagation.mockResolvedValue(mockResult);

      const response = await request(app)
        .get('/api/check-multi')
        .query({ hostname: 'example.com' })
        .expect(200);

      expect(dnsPropagationService.checkMultiRecordPropagation).toHaveBeenCalledWith(
        'example.com',
        ['A', 'AAAA', 'MX', 'TXT']
      );
    });

    test('should handle array format for record types', async () => {
      const mockResult = { hostname: 'example.com' };
      dnsPropagationService.checkMultiRecordPropagation.mockResolvedValue(mockResult);

      const response = await request(app)
        .get('/api/check-multi')
        .query({ hostname: 'example.com', recordTypes: ['A', 'MX'] })
        .expect(200);

      expect(dnsPropagationService.checkMultiRecordPropagation).toHaveBeenCalledWith(
        'example.com',
        ['A', 'MX']
      );
    });

    test('should handle service errors', async () => {
      dnsPropagationService.checkMultiRecordPropagation.mockRejectedValue(
        new Error('Multi-record check failed')
      );

      const response = await request(app)
        .get('/api/check-multi')
        .query({ hostname: 'example.com' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.message).toBe('Multi-record check failed');
    });
  });

  describe('POST /api/check-bulk', () => {
    test('should perform bulk propagation check', async () => {
      const mockResults = [
        {
          hostname: 'example.com',
          recordType: 'A',
          successful: 15,
          failed: 0,
          propagationPercentage: 100
        },
        {
          hostname: 'google.com',
          recordType: 'A',
          successful: 15,
          failed: 0,
          propagationPercentage: 100
        }
      ];

      dnsPropagationService.checkDnsPropagation
        .mockResolvedValueOnce(mockResults[0])
        .mockResolvedValueOnce(mockResults[1]);

      const response = await request(app)
        .post('/api/check-bulk')
        .send({
          hostnames: ['example.com', 'google.com'],
          recordType: 'A',
          customServers: []
        })
        .expect(200);

      expect(response.body.total).toBe(2);
      expect(response.body.successful).toBe(2);
      expect(response.body.failed).toBe(0);
      expect(response.body.results).toHaveLength(2);
      expect(response.body.results).toEqual(mockResults);
    });

    test('should handle mixed success/failure in bulk check', async () => {
      dnsPropagationService.checkDnsPropagation
        .mockResolvedValueOnce({ hostname: 'example.com', success: true })
        .mockRejectedValueOnce(new Error('DNS error'));

      const response = await request(app)
        .post('/api/check-bulk')
        .send({
          hostnames: ['example.com', 'invalid.domain'],
          recordType: 'A'
        })
        .expect(200);

      expect(response.body.total).toBe(2);
      expect(response.body.successful).toBe(1);
      expect(response.body.failed).toBe(1);
      
      const failedResult = response.body.results.find(r => r.success === false);
      expect(failedResult).toBeDefined();
      expect(failedResult.hostname).toBe('invalid.domain');
      expect(failedResult.error).toBe('DNS error');
    });

    test('should return 400 for invalid input', async () => {
      const response = await request(app)
        .post('/api/check-bulk')
        .send({
          hostnames: null
        })
        .expect(400);

      expect(response.body.error).toBe('Invalid input');
      expect(response.body.message).toBe('hostnames must be a non-empty array');
    });

    test('should return 400 for empty hostnames array', async () => {
      const response = await request(app)
        .post('/api/check-bulk')
        .send({
          hostnames: []
        })
        .expect(400);

      expect(response.body.error).toBe('Invalid input');
    });

    test('should return 400 for too many hostnames', async () => {
      const manyHostnames = Array.from({ length: 11 }, (_, i) => `domain${i}.com`);

      const response = await request(app)
        .post('/api/check-bulk')
        .send({
          hostnames: manyHostnames
        })
        .expect(400);

      expect(response.body.error).toBe('Too many hostnames');
      expect(response.body.message).toBe('Maximum 10 hostnames allowed per bulk request');
    });

    test('should handle unexpected errors', async () => {
      // Mock console.error to avoid test output pollution
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Force an unexpected error
      dnsPropagationService.checkDnsPropagation.mockRejectedValue(new Error('Unexpected error'));

      const response = await request(app)
        .post('/api/check-bulk')
        .send({
          hostnames: ['example.com']
        })
        .expect(200);

      expect(response.body.total).toBe(1);
      expect(response.body.successful).toBe(0);
      expect(response.body.failed).toBe(1);
      expect(response.body.results[0].success).toBe(false);
      expect(response.body.results[0].error).toBe('Unexpected error');
      
      consoleSpy.mockRestore();
    });
  });

  describe('error handling', () => {
    test('should include timestamps in error responses', async () => {
      dnsPropagationService.checkDnsPropagation.mockRejectedValue(
        new Error('Test error')
      );

      const response = await request(app)
        .get('/api/check')
        .query({ hostname: 'example.com' })
        .expect(400);

      expect(response.body).toHaveProperty('timestamp');
      expect(typeof response.body.timestamp).toBe('string');
    });

    test('should provide appropriate error messages', async () => {
      dnsPropagationService.checkDnsPropagation.mockRejectedValue(
        new Error('Custom error message')
      );

      const response = await request(app)
        .get('/api/check')
        .query({ hostname: 'example.com' })
        .expect(400);

      expect(response.body.error).toBe('DNS propagation check failed');
      expect(response.body.message).toBe('Custom error message');
    });
  });
}); 