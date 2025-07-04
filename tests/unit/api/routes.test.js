const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');

// Mock services
jest.mock('../../../src/services/pingService');
jest.mock('../../../src/services/spamAssassinService');
jest.mock('../../../src/services/smtpService');
jest.mock('../../../src/services/base64Service');
jest.mock('../../../src/services/hashService');
jest.mock('../../../src/services/sslValidationService');
jest.mock('../../../src/services/whoamiService');
jest.mock('../../../src/services/portScanner');
jest.mock('../../../src/services/headerAnalysisService');
jest.mock('../../../src/services/emailTestService');
jest.mock('../../../src/services/checkBlacklist');

const { pingHost, tracerouteHost } = require('../../../src/services/pingService');
const { scanEmailWithSpamAssassin } = require('../../../src/services/spamAssassinService');
const { testSMTPConnection } = require('../../../src/services/smtpService');
const { encode, decode } = require('../../../src/services/base64Service');
const { hashPassword, validateHash } = require('../../../src/services/hashService');
const { validateSSL } = require('../../../src/services/sslValidationService');
const { getWhoAmI } = require('../../../src/services/whoamiService');
const { scanPorts } = require('../../../src/services/portScanner');
const { analyzeHeaders } = require('../../../src/services/headerAnalysisService');
const { testEmailDelivery } = require('../../../src/services/emailTestService');
const { checkEmailBlacklist } = require('../../../src/services/checkBlacklist');

// Import routes
const pingRoutes = require('../../../src/api/routes/pingRoutes');
const scanEmailRoutes = require('../../../src/api/routes/scanEmail');
const smtpRoutes = require('../../../src/api/routes/smtpRoutes');
const base64Routes = require('../../../src/api/routes/base64Route');
const hashRoutes = require('../../../src/api/routes/hashRoutes');
const sslValidationRoutes = require('../../../src/api/routes/sslValidationRoutes');
const whoamiRoutes = require('../../../src/api/routes/whoamiRoutes');
const portScannerRoutes = require('../../../src/api/routes/portScannerRoute');
const emailHeaderAnalysisRoutes = require('../../../src/api/routes/emailHeaderAnalysisRoutes');
const emailTestRoutes = require('../../../src/api/routes/emailTestRoute');
const emailBlacklistRoutes = require('../../../src/api/routes/emailBlacklistRoutes');

describe('API Routes Integration Tests', () => {
  let app;

  beforeEach(() => {
    // Create a new Express app for each test
    app = express();
    app.use(bodyParser.json({ limit: '10mb' }));
    app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
    app.use(bodyParser.text({ limit: '10mb' }));
    
    // Mount routes
    app.use('/api', pingRoutes);
    app.use('/api', scanEmailRoutes);
    app.use('/api', smtpRoutes);
    app.use('/api', base64Routes);
    app.use('/api', hashRoutes);
    app.use('/api', sslValidationRoutes);
    app.use('/api', whoamiRoutes);
    app.use('/api', portScannerRoutes);
    app.use('/api', emailHeaderAnalysisRoutes);
    app.use('/api', emailTestRoutes);
    app.use('/api', emailBlacklistRoutes);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('Ping Routes', () => {
    test('POST /api/ping should return ping results', async () => {
      pingHost.mockResolvedValue('PING google.com success');

      const response = await request(app)
        .post('/api/ping')
        .send({ host: 'google.com' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        host: 'google.com',
        result: 'PING google.com success'
      });
      expect(pingHost).toHaveBeenCalledWith('google.com');
    });

    test('POST /api/traceroute should return traceroute results', async () => {
      tracerouteHost.mockResolvedValue('traceroute to google.com success');

      const response = await request(app)
        .post('/api/traceroute')
        .send({ host: 'google.com' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        host: 'google.com',
        result: 'traceroute to google.com success'
      });
      expect(tracerouteHost).toHaveBeenCalledWith('google.com');
    });

    test('POST /api/ping should handle missing host', async () => {
      const response = await request(app)
        .post('/api/ping')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Host is required'
      });
    });
  });

  describe('Spam Scan Routes', () => {
    test('POST /api/scan-email should scan email content', async () => {
      const mockScanResult = {
        score: '0 / 0',
        decision: 'Scan Complete (No Rules)',
        details: []
      };
      scanEmailWithSpamAssassin.mockResolvedValue(mockScanResult);

      const response = await request(app)
        .post('/api/scan-email')
        .attach('emailFile', Buffer.from('Subject: Test\n\nTest email'), 'test.eml');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockScanResult);
      expect(scanEmailWithSpamAssassin).toHaveBeenCalled();
    });

    test('POST /api/scan-email should handle missing file', async () => {
      const response = await request(app)
        .post('/api/scan-email')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'No email file provided'
      });
    });
  });

  describe('SMTP Routes', () => {
    test('POST /api/test-smtp should test SMTP connection', async () => {
      const mockResult = {
        success: true,
        message: 'SMTP connection successful',
        responseTime: 150
      };
      testSMTPConnection.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/test-smtp')
        .send({
          host: 'smtp.gmail.com',
          port: 587
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResult);
      expect(testSMTPConnection).toHaveBeenCalledWith({
        host: 'smtp.gmail.com',
        port: 587
      });
    });

    test('POST /api/test-smtp should handle missing parameters', async () => {
      const response = await request(app)
        .post('/api/test-smtp')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Host and port are required'
      });
    });
  });

  describe('Base64 Routes', () => {
    test('POST /api/encode should encode text', async () => {
      encode.mockReturnValue('SGVsbG8gV29ybGQ=');

      const response = await request(app)
        .post('/api/encode')
        .send({ text: 'Hello World' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        data: { encodedText: 'SGVsbG8gV29ybGQ=' }
      });
      expect(encode).toHaveBeenCalledWith('Hello World');
    });

    test('POST /api/decode should decode text', async () => {
      decode.mockReturnValue('Hello World');

      const response = await request(app)
        .post('/api/decode')
        .send({ text: 'SGVsbG8gV29ybGQ=' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        data: { decodedText: 'Hello World' }
      });
      expect(decode).toHaveBeenCalledWith('SGVsbG8gV29ybGQ=');
    });
  });

  describe('Hash Routes', () => {
    test('POST /api/hash should hash password', async () => {
      hashPassword.mockResolvedValue('$2b$10$hashedpassword');

      const response = await request(app)
        .post('/api/hash')
        .send({ 
          password: 'mypassword',
          algorithm: 'bcrypt'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('hash');
      expect(hashPassword).toHaveBeenCalledWith('mypassword', 'bcrypt');
    });

    test('POST /api/validate-hash should validate hash', async () => {
      validateHash.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/validate-hash')
        .send({
          password: 'mypassword',
          hash: '$2b$10$hashedpassword',
          algorithm: 'bcrypt'
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ valid: true });
      expect(validateHash).toHaveBeenCalledWith('mypassword', '$2b$10$hashedpassword', 'bcrypt');
    });
  });

  describe('SSL Validation Routes', () => {
    test('POST /api/validate-ssl should validate SSL certificate', async () => {
      const mockResult = {
        valid: true,
        certificate: {
          subject: { CN: 'google.com' },
          issuer: { CN: 'Google Trust Services' },
          validFrom: '2024-01-01',
          validTo: '2024-12-31'
        }
      };
      validateSSL.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/validate-ssl')
        .send({ hostname: 'google.com' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResult);
      expect(validateSSL).toHaveBeenCalledWith('google.com', 443);
    });
  });

  describe('WhoAmI Routes', () => {
    test('GET /api/whoami should return IP information', async () => {
      const mockResult = {
        ip: '8.8.8.8',
        country: 'United States',
        city: 'Mountain View',
        isp: 'Google LLC'
      };
      getWhoAmI.mockResolvedValue(mockResult);

      const response = await request(app)
        .get('/api/whoami');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResult);
      expect(getWhoAmI).toHaveBeenCalled();
    });
  });

  describe('Port Scanner Routes', () => {
    test('POST /api/port-scan should scan ports', async () => {
      const mockResult = {
        host: 'google.com',
        openPorts: [80, 443],
        closedPorts: [22, 21]
      };
      scanPorts.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/port-scan')
        .send({
          host: 'google.com',
          ports: [80, 443, 22, 21]
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResult);
      expect(scanPorts).toHaveBeenCalledWith('google.com', [80, 443, 22, 21]);
    });
  });

  describe('Email Header Analysis Routes', () => {
    test('POST /api/analyze-headers should analyze email headers', async () => {
      const mockResult = {
        spam_score: 0.5,
        authentication: {
          spf: 'pass',
          dkim: 'pass',
          dmarc: 'pass'
        }
      };
      analyzeHeaders.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/analyze-headers')
        .send({ headers: 'Received: from example.com\nSubject: Test' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResult);
      expect(analyzeHeaders).toHaveBeenCalledWith('Received: from example.com\nSubject: Test');
    });
  });

  describe('Email Test Routes', () => {
    test('POST /api/test-email-delivery should test email delivery', async () => {
      const mockResult = {
        success: true,
        message: 'Email sent successfully',
        latency: '250ms'
      };
      testEmailDelivery.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/test-email-delivery')
        .send({
          smtpConfig: { host: 'smtp.gmail.com', port: 587 },
          imapConfig: { host: 'imap.gmail.com', port: 993 },
          testEmail: 'test@example.com'
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResult);
      expect(testEmailDelivery).toHaveBeenCalled();
    });
  });

  describe('Email Blacklist Routes', () => {
    test('POST /api/check-blacklist should check email blacklist', async () => {
      const mockResult = {
        email: 'test@example.com',
        blacklisted: false,
        sources: []
      };
      checkEmailBlacklist.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/check-blacklist')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResult);
      expect(checkEmailBlacklist).toHaveBeenCalledWith('test@example.com');
    });
  });

  describe('Error Handling', () => {
    test('should handle service errors gracefully', async () => {
      pingHost.mockRejectedValue(new Error('Network error'));

      const response = await request(app)
        .post('/api/ping')
        .send({ host: 'invalid.com' });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });

    test('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/ping')
        .send('invalid json')
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(400);
    });
  });
}); 