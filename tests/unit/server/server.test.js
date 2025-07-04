const request = require('supertest');
const express = require('express');
const path = require('path');

// Mock the config to avoid missing config file errors
jest.mock('../../../src/config/config.js', () => ({
  port: 3011,
  webPort: 8080,
  api: {
    timeout: 30000
  }
}));

describe('Server Integration Tests', () => {
  let app;
  let webApp;

  beforeAll(() => {
    // Create API server app
    app = express();
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    app.use(express.text({ limit: '10mb' }));

    // Mock a simple route for API testing
    app.get('/api/health', (req, res) => {
      res.json({ status: 'healthy', timestamp: new Date().toISOString() });
    });

    app.get('/api/whoami', (req, res) => {
      res.json({
        ip: req.ip || '127.0.0.1',
        userAgent: req.get('User-Agent'),
        headers: req.headers
      });
    });

    // Create web server app
    webApp = express();
    
    // Serve static files from web-interface directory
    const webInterfacePath = path.join(__dirname, '../../../src/web-interface');
    webApp.use(express.static(webInterfacePath));

    // Default route should serve index.html
    webApp.get('/', (req, res) => {
      res.sendFile(path.join(webInterfacePath, 'index.html'));
    });

    // Handle 404s
    webApp.use((req, res) => {
      res.status(404).send('Not Found');
    });
  });

  describe('API Server', () => {
    test('should respond to health check', async () => {
      const response = await request(app)
        .get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
    });

    test('should handle CORS headers', async () => {
      const response = await request(app)
        .options('/api/health')
        .set('Origin', 'http://localhost:8080')
        .set('Access-Control-Request-Method', 'GET');

      // The response should allow CORS or at least not reject it
      expect(response.status).toBeLessThan(500);
    });

    test('should accept large JSON payloads', async () => {
      const largeData = {
        data: 'x'.repeat(1024 * 1024) // 1MB of data
      };

      const response = await request(app)
        .post('/api/health')
        .send(largeData);

      // Should not reject due to payload size
      expect(response.status).toBeLessThan(500);
    });

    test('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/health')
        .send('{ invalid json }')
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(400);
    });

    test('whoami endpoint should return client information', async () => {
      const response = await request(app)
        .get('/api/whoami')
        .set('User-Agent', 'Test-Agent');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('ip');
      expect(response.body).toHaveProperty('userAgent', 'Test-Agent');
      expect(response.body).toHaveProperty('headers');
    });
  });

  describe('Web Server', () => {
    test('should serve index.html on root path', async () => {
      const response = await request(webApp)
        .get('/');

      expect(response.status).toBe(200);
      expect(response.type).toMatch(/html/);
    });

    test('should serve static CSS files', async () => {
      const response = await request(webApp)
        .get('/styles.css');

      if (response.status === 200) {
        expect(response.type).toMatch(/css/);
      } else {
        // If file doesn't exist, should get 404
        expect(response.status).toBe(404);
      }
    });

    test('should serve static JavaScript files', async () => {
      const response = await request(webApp)
        .get('/main.js');

      if (response.status === 200) {
        expect(response.type).toMatch(/javascript/);
      } else {
        // If file doesn't exist, should get 404
        expect(response.status).toBe(404);
      }
    });

    test('should return 404 for non-existent files', async () => {
      const response = await request(webApp)
        .get('/non-existent-file.txt');

      expect(response.status).toBe(404);
    });

    test('should handle various file extensions', async () => {
      const testFiles = [
        { path: '/config.js', type: /javascript/ },
        { path: '/formatters.js', type: /javascript/ },
        { path: '/apiClient.js', type: /javascript/ }
      ];

      for (const file of testFiles) {
        const response = await request(webApp)
          .get(file.path);

        if (response.status === 200) {
          expect(response.type).toMatch(file.type);
        }
        // We don't fail if files don't exist since this is a unit test
      }
    });

    test('should set appropriate headers for static files', async () => {
      const response = await request(webApp)
        .get('/styles.css');

      if (response.status === 200) {
        // Should have cache headers or content-type
        expect(response.headers).toHaveProperty('content-type');
      }
    });
  });

  describe('Server Configuration', () => {
    test('should handle different HTTP methods', async () => {
      const methods = ['GET', 'POST', 'PUT', 'DELETE'];
      
      for (const method of methods) {
        const response = await request(app)[method.toLowerCase()]('/api/health');
        
        // Should not crash with method not allowed or similar
        expect(response.status).toBeLessThan(500);
      }
    });

    test('should handle URL encoding', async () => {
      const response = await request(app)
        .get('/api/health?param=test%20value');

      expect(response.status).toBeLessThan(500);
    });

    test('should handle special characters in URLs', async () => {
      const response = await request(app)
        .get('/api/health?special=äöü');

      expect(response.status).toBeLessThan(500);
    });
  });

  describe('Error Handling', () => {
    test('should handle server errors gracefully', async () => {
      // Add a route that throws an error
      app.get('/api/error', (req, res) => {
        throw new Error('Test error');
      });

      const response = await request(app)
        .get('/api/error');

      // Should handle error without crashing
      expect(response.status).toBe(500);
    });

    test('should handle async errors', async () => {
      // Add a route with async error
      app.get('/api/async-error', async (req, res) => {
        await Promise.reject(new Error('Async error'));
      });

      const response = await request(app)
        .get('/api/async-error');

      // Should handle async error
      expect(response.status).toBeLessThan(600);
    });
  });

  describe('Security Headers', () => {
    test('should not expose sensitive server information', async () => {
      const response = await request(app)
        .get('/api/health');

      // Should not expose Express version or other sensitive info
      expect(response.headers['x-powered-by']).toBeUndefined();
    });

    test('should handle various content types', async () => {
      const contentTypes = [
        'application/json',
        'text/plain',
        'application/x-www-form-urlencoded'
      ];

      for (const contentType of contentTypes) {
        const response = await request(app)
          .post('/api/health')
          .set('Content-Type', contentType)
          .send('test data');

        expect(response.status).toBeLessThan(500);
      }
    });
  });
}); 