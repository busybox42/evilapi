const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');

describe('API Routes Smoke Tests', () => {
  let app;

  beforeAll(() => {
    // Create a test Express app with basic middleware
    app = express();
    app.use(bodyParser.json({ limit: '10mb' }));
    app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
    app.use(bodyParser.text({ limit: '10mb' }));

    // Add basic test routes
    app.get('/api/health', (req, res) => {
      res.json({ status: 'healthy', timestamp: new Date().toISOString() });
    });

    app.post('/api/echo', (req, res) => {
      res.json({ received: req.body });
    });

    // Base64 encode/decode (using Node.js built-in)
    app.post('/api/encode', (req, res) => {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ error: 'Text is required' });
      }
      const encodedText = Buffer.from(text).toString('base64');
      res.json({ 
        success: true,
        data: { encodedText },
        message: 'Text encoded successfully',
        timestamp: new Date().toISOString()
      });
    });

    app.post('/api/decode', (req, res) => {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ error: 'Text is required' });
      }
      try {
        const decodedText = Buffer.from(text, 'base64').toString();
        res.json({ 
          success: true,
          data: { decodedText },
          message: 'Text decoded successfully',
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        res.status(400).json({ error: 'Invalid base64 text' });
      }
    });

    // Mock file upload for spam scanning
    const upload = multer();
    app.post('/api/scan-email', upload.single('emailFile'), (req, res) => {
      if (!req.file) {
        return res.status(400).json({ error: 'No email file provided' });
      }

      const emailContent = req.file.buffer.toString();
      res.json({
        score: '0 / 0',
        decision: 'Scan Complete (No Rules)',
        details: [],
        emailSize: emailContent.length,
        timestamp: new Date().toISOString()
      });
    });

    // Error handling
    app.use((err, req, res, next) => {
      // Handle specific error types
      if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ error: 'Invalid JSON format' });
      }
      res.status(500).json({ error: err.message });
    });
  });

  describe('Health Check', () => {
    test('should respond to health check', async () => {
      const response = await request(app)
        .get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('Request Echo', () => {
    test('should echo request body', async () => {
      const testData = { message: 'Hello World', number: 42 };

      const response = await request(app)
        .post('/api/echo')
        .send(testData);

      expect(response.status).toBe(200);
      expect(response.body.received).toEqual(testData);
    });
  });

  describe('Base64 Operations', () => {
    test('should encode text to base64', async () => {
      const testText = 'Hello World';
      const expectedEncoded = 'SGVsbG8gV29ybGQ=';

      const response = await request(app)
        .post('/api/encode')
        .send({ text: testText });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.encodedText).toBe(expectedEncoded);
    });

    test('should decode base64 text', async () => {
      const encodedText = 'SGVsbG8gV29ybGQ=';
      const expectedDecoded = 'Hello World';

      const response = await request(app)
        .post('/api/decode')
        .send({ text: encodedText });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.decodedText).toBe(expectedDecoded);
    });

    test('should handle missing text in encode', async () => {
      const response = await request(app)
        .post('/api/encode')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Text is required');
    });

    test('should handle invalid base64 in decode', async () => {
      const response = await request(app)
        .post('/api/decode')
        .send({ text: 'invalid base64!' });

      // Node.js Buffer handles invalid base64 gracefully, so it returns 200
      // but the decoded text will be garbled
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('decodedText');
    });
  });

  describe('File Upload', () => {
    test('should handle email file upload', async () => {
      const testEmail = 'Subject: Test\nFrom: test@example.com\n\nTest email content';

      const response = await request(app)
        .post('/api/scan-email')
        .attach('emailFile', Buffer.from(testEmail), 'test.eml');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('score');
      expect(response.body).toHaveProperty('decision');
      expect(response.body.emailSize).toBe(testEmail.length);
    });

    test('should handle missing file upload', async () => {
      const response = await request(app)
        .post('/api/scan-email')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'No email file provided');
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/echo')
        .send('{ invalid json }')
        .set('Content-Type', 'application/json');

      // Express body parser can return either 400 or 500 depending on the error
      expect([400, 500]).toContain(response.status);
      expect(response.body).toHaveProperty('error');
    });

    test('should handle large payloads', async () => {
      const largeText = 'x'.repeat(1024 * 100); // 100KB

      const response = await request(app)
        .post('/api/encode')
        .send({ text: largeText });

      expect(response.status).toBeLessThan(500);
    });
  });

  describe('Content Types', () => {
    test('should handle JSON requests', async () => {
      const response = await request(app)
        .post('/api/echo')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({ test: 'data' }));

      expect(response.status).toBe(200);
    });

    test('should handle form data requests', async () => {
      const response = await request(app)
        .post('/api/encode')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send('text=hello');

      expect(response.status).toBe(200);
      expect(response.body.data.encodedText).toBe('aGVsbG8=');
    });
  });
}); 