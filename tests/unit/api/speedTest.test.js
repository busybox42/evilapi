
const request = require('supertest');
const express = require('express');
const speedTestRoute = require('../../../src/api/routes/speedTestRoute');

const app = express();
app.use('/api/speedtest', speedTestRoute);

describe('Speed Test API', () => {
  describe('GET /api/speedtest/download', () => {
    it('should return a 200 OK status and a 10MB payload', async () => {
      const response = await request(app).get('/api/speedtest/download');
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('application/octet-stream');
      expect(response.headers['content-length']).toBe(String(50 * 1024 * 1024));
    });
  });

  describe('POST /api/speedtest/upload', () => {
    it('should return a 200 OK status and the received data size', async () => {
      const data = Buffer.alloc(5 * 1024 * 1024, 'a'); // 5MB of 'a's
      const response = await request(app)
        .post('/api/speedtest/upload')
        .set('Content-Type', 'application/octet-stream')
        .send(data);

      expect(response.status).toBe(200);
      expect(response.body.received).toBe(5 * 1024 * 1024);
    });
  });
});
