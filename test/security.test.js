const request = require('supertest');
const express = require('express');
const helmet = require('helmet');
const Joi = require('joi');

const app = express();
app.use(helmet());

app.use(express.json());

const contactNameSchema = Joi.string().trim().max(100).pattern(/^[a-zA-ZåäöÅÄÖ0-9\s\-\/]+$/).default('Familj / Family');
const contactCodeSchema = Joi.string().length(8).pattern(/^[A-Z0-9]+$/).uppercase().required();

app.post('/test/contact', (req, res) => {
  const { error, value } = contactNameSchema.validate(req.body.name);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  res.json({ name: value });
});

app.get('/test/code/:code', (req, res) => {
  const { error, value } = contactCodeSchema.validate(req.params.code);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  res.json({ code: value });
});

describe('Security Tests', () => {
  describe('Input Validation', () => {
    test('should validate contact name', async () => {
      const response = await request(app)
        .post('/test/contact')
        .send({ name: 'Test Family' });
      
      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Test Family');
    });

    test('should validate Swedish characters in name', async () => {
      const response = await request(app)
        .post('/test/contact')
        .send({ name: 'Farmor Anna-Britt' });
      
      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Farmor Anna-Britt');
    });

    test('should reject XSS in contact name', async () => {
      const response = await request(app)
        .post('/test/contact')
        .send({ name: '<script>alert("XSS")</script>' });
      
      expect(response.status).toBe(400);
    });

    test('should reject SQL injection attempt', async () => {
      const response = await request(app)
        .post('/test/contact')
        .send({ name: "'; DROP TABLE users; --" });
      
      expect(response.status).toBe(400);
    });

    test('should reject name over 100 chars', async () => {
      const response = await request(app)
        .post('/test/contact')
        .send({ name: 'A'.repeat(101) });
      
      expect(response.status).toBe(400);
    });

    test('should validate contact code', async () => {
      const response = await request(app)
        .get('/test/code/ABC12345');
      
      expect(response.status).toBe(200);
      expect(response.body.code).toBe('ABC12345');
    });

    test('should reject invalid contact code', async () => {
      const response = await request(app)
        .get('/test/code/invalid!');
      
      expect(response.status).toBe(400);
    });

    test('should reject short contact code', async () => {
      const response = await request(app)
        .get('/test/code/ABC123');
      
      expect(response.status).toBe(400);
    });

    test('should reject long contact code', async () => {
      const response = await request(app)
        .get('/test/code/ABCDEFGHIJ');
      
      expect(response.status).toBe(400);
    });
  });

  describe('Security Headers', () => {
    test('should have X-Content-Type-Options header', async () => {
      const response = await request(app)
        .get('/test/code/ABC12345');
      
      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });

    test('should have X-Frame-Options header', async () => {
      const response = await request(app)
        .get('/test/code/ABC12345');
      
      expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
    });

    test('should have X-XSS-Protection header', async () => {
      const response = await request(app)
        .get('/test/code/ABC12345');
      
      expect(response.headers['x-xss-protection']).toBe('0');
    });

    test('should have Strict-Transport-Security header', async () => {
      const response = await request(app)
        .get('/test/code/ABC12345');
      
      expect(response.headers['strict-transport-security']).toBeDefined();
    });
  });
});
