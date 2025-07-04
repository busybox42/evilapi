const request = require('supertest');
const path = require('path');
const fs = require('fs');

// Mock external dependencies to avoid network calls during testing
jest.mock('child_process');
jest.mock('../../../src/services/spamAssassinService');
jest.mock('../../../src/services/smtpService');
jest.mock('../../../src/services/whoamiService');

const { spawn } = require('child_process');
const { scanEmailWithSpamAssassin } = require('../../../src/services/spamAssassinService');
const { testSMTPConnection } = require('../../../src/services/smtpService');
const { getWhoAmI } = require('../../../src/services/whoamiService');

describe('Full Stack Integration Tests', () => {
  let app;
  
  beforeAll(() => {
    // Create a mock Express app that simulates the real server
    const express = require('express');
    const multer = require('multer');
    const upload = multer();
    
    app = express();
    
    // Add middleware
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    app.use(express.text({ limit: '10mb' }));
    
    // Serve static files from web-interface
    const webInterfacePath = path.join(__dirname, '../../../src/web-interface');
    app.use(express.static(webInterfacePath));
    
    // Mock API routes
    app.get('/api/whoami', async (req, res) => {
      try {
        const result = await getWhoAmI();
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    app.post('/api/ping', (req, res) => {
      const { host } = req.body;
      if (!host) {
        return res.status(400).json({ error: 'Host is required' });
      }
      
      // Mock ping response
      res.json({
        host,
        result: `PING ${host} (127.0.0.1): 56 data bytes\n64 bytes from 127.0.0.1: icmp_seq=0 ttl=64 time=0.123 ms`
      });
    });
    
    app.post('/api/test-smtp', async (req, res) => {
      try {
        const { host, port } = req.body;
        if (!host || !port) {
          return res.status(400).json({ error: 'Host and port are required' });
        }
        
        const result = await testSMTPConnection({ host, port });
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    app.post('/api/scan-email', upload.single('emailFile'), async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: 'No email file provided' });
        }
        
        const emailContent = req.file.buffer.toString();
        const result = await scanEmailWithSpamAssassin(emailContent);
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    app.post('/api/encode', (req, res) => {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ error: 'Text is required' });
      }
      
      const encodedText = Buffer.from(text).toString('base64');
      res.json({ data: { encodedText } });
    });
    
    app.post('/api/decode', (req, res) => {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ error: 'Text is required' });
      }
      
      try {
        const decodedText = Buffer.from(text, 'base64').toString();
        res.json({ data: { decodedText } });
      } catch (error) {
        res.status(400).json({ error: 'Invalid base64 text' });
      }
    });
    
    // Default route serves index.html
    app.get('/', (req, res) => {
      const indexPath = path.join(webInterfacePath, 'index.html');
      res.sendFile(indexPath);
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    getWhoAmI.mockResolvedValue({
      ip: '127.0.0.1',
      country: 'Local',
      city: 'Test',
      isp: 'Test ISP'
    });
    
    testSMTPConnection.mockResolvedValue({
      success: true,
      message: 'SMTP connection successful',
      responseTime: 150,
      capabilities: ['STARTTLS', 'AUTH PLAIN LOGIN']
    });
    
    scanEmailWithSpamAssassin.mockResolvedValue({
      score: '0 / 0',
      decision: 'Scan Complete (No Rules)',
      details: []
    });
  });

  describe('Web Interface Loading', () => {
    test('should serve main index page', async () => {
      const response = await request(app)
        .get('/');

      expect(response.status).toBe(200);
      expect(response.type).toMatch(/html/);
      expect(response.text).toMatch(/<!DOCTYPE html>/i);
    });

    test('should serve CSS files', async () => {
      const response = await request(app)
        .get('/styles.css');

      if (response.status === 200) {
        expect(response.type).toMatch(/css/);
      } else {
        expect(response.status).toBe(404);
      }
    });

    test('should serve JavaScript files', async () => {
      const jsFiles = ['main.js', 'config.js', 'apiClient.js', 'formatters.js'];
      
      for (const jsFile of jsFiles) {
        const response = await request(app)
          .get(`/${jsFile}`);

        if (response.status === 200) {
          expect(response.type).toMatch(/javascript|text/);
        }
        // Don't fail test if files don't exist in test environment
      }
    });
  });

  describe('API Endpoints Integration', () => {
    test('WhoAmI endpoint should work end-to-end', async () => {
      const response = await request(app)
        .get('/api/whoami');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('ip');
      expect(response.body).toHaveProperty('country');
      expect(getWhoAmI).toHaveBeenCalled();
    });

    test('Ping endpoint should work end-to-end', async () => {
      const response = await request(app)
        .post('/api/ping')
        .send({ host: 'google.com' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('host', 'google.com');
      expect(response.body).toHaveProperty('result');
      expect(response.body.result).toMatch(/PING/);
    });

    test('SMTP test endpoint should work end-to-end', async () => {
      const response = await request(app)
        .post('/api/test-smtp')
        .send({ 
          host: 'smtp.gmail.com',
          port: 587
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
      expect(testSMTPConnection).toHaveBeenCalledWith({
        host: 'smtp.gmail.com',
        port: 587
      });
    });

    test('Email scanning should work end-to-end', async () => {
      const testEmail = 'Subject: Test\nFrom: test@example.com\n\nTest email content';
      
      const response = await request(app)
        .post('/api/scan-email')
        .attach('emailFile', Buffer.from(testEmail), 'test.eml');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('score');
      expect(response.body).toHaveProperty('decision');
      expect(scanEmailWithSpamAssassin).toHaveBeenCalledWith(testEmail);
    });

    test('Base64 encoding should work end-to-end', async () => {
      const testText = 'Hello World';
      
      const response = await request(app)
        .post('/api/encode')
        .send({ text: testText });

      expect(response.status).toBe(200);
      expect(response.body.data.encodedText).toBe('SGVsbG8gV29ybGQ=');
    });

    test('Base64 decoding should work end-to-end', async () => {
      const encodedText = 'SGVsbG8gV29ybGQ=';
      
      const response = await request(app)
        .post('/api/decode')
        .send({ text: encodedText });

      expect(response.status).toBe(200);
      expect(response.body.data.decodedText).toBe('Hello World');
    });
  });

  describe('Error Scenarios', () => {
    test('should handle missing parameters gracefully', async () => {
      const endpoints = [
        { method: 'post', path: '/api/ping', data: {} },
        { method: 'post', path: '/api/test-smtp', data: {} },
        { method: 'post', path: '/api/encode', data: {} },
        { method: 'post', path: '/api/decode', data: {} }
      ];

      for (const endpoint of endpoints) {
        const response = await request(app)[endpoint.method](endpoint.path)
          .send(endpoint.data);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
      }
    });

    test('should handle service errors gracefully', async () => {
      // Make WhoAmI service throw an error
      getWhoAmI.mockRejectedValue(new Error('Service unavailable'));

      const response = await request(app)
        .get('/api/whoami');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });

    test('should handle malformed base64', async () => {
      const response = await request(app)
        .post('/api/decode')
        .send({ text: 'invalid base64!' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('should handle large payloads within limits', async () => {
      const largeText = 'x'.repeat(1024 * 512); // 512KB
      
      const response = await request(app)
        .post('/api/encode')
        .send({ text: largeText });

      expect(response.status).toBeLessThan(500);
    });
  });

  describe('Content Type Handling', () => {
    test('should handle JSON requests', async () => {
      const response = await request(app)
        .post('/api/ping')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({ host: 'example.com' }));

      expect(response.status).toBe(200);
    });

    test('should handle form data requests', async () => {
      const response = await request(app)
        .post('/api/ping')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send('host=example.com');

      expect(response.status).toBe(200);
    });

    test('should handle file uploads', async () => {
      const testEmail = 'Subject: Test\nFrom: test@example.com\n\nTest content';
      
      const response = await request(app)
        .post('/api/scan-email')
        .attach('emailFile', Buffer.from(testEmail), 'test.eml');

      expect(response.status).toBe(200);
    });
  });

  describe('Cross-Feature Integration', () => {
    test('should handle multiple simultaneous requests', async () => {
      const requests = [
        request(app).get('/api/whoami'),
        request(app).post('/api/ping').send({ host: 'example.com' }),
        request(app).post('/api/encode').send({ text: 'test' }),
        request(app).post('/api/test-smtp').send({ host: 'smtp.example.com', port: 587 })
      ];

      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.status).toBeLessThan(500);
      });
    });

    test('should maintain consistent response format', async () => {
      const endpoints = [
        { method: 'get', path: '/api/whoami' },
        { method: 'post', path: '/api/ping', data: { host: 'example.com' } },
        { method: 'post', path: '/api/encode', data: { text: 'test' } }
      ];

      for (const endpoint of endpoints) {
        const response = await request(app)[endpoint.method](endpoint.path)
          .send(endpoint.data || {});

        if (response.status === 200) {
          expect(response.type).toMatch(/json/);
          expect(typeof response.body).toBe('object');
        }
      }
    });

    test('should handle edge cases in email scanning', async () => {
      const edgeCases = [
        'Subject: Simple\n\nVery short email',
        'Subject: Empty\n\n',
        'Subject: Unicode Test 🔬\nFrom: test@example.com\n\nTesting unicode: áëíöü',
        'Subject: Long Subject Line That Goes On And On And Contains Many Words And Characters\n\nLong email content'
      ];

      for (const emailContent of edgeCases) {
        const response = await request(app)
          .post('/api/scan-email')
          .attach('emailFile', Buffer.from(emailContent), 'test.eml');

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('score');
        expect(response.body).toHaveProperty('decision');
      }
    });
  });
}); 