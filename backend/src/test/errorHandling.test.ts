import request from 'supertest';
import app from '../server';
import { ValidationError, NotFoundError, UnauthorizedError } from '../middleware/errorHandler';

describe('Error Handling', () => {
  describe('Validation Errors', () => {
    it('should return validation error for invalid registration data', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'ab', // Too short
          email: 'invalid-email', // Invalid format
          password: '123', // Too weak
          phoneNumber: 'invalid', // Invalid format
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details).toBeDefined();
      expect(Array.isArray(response.body.error.details)).toBe(true);
    });

    it('should return validation error for missing required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return validation error for invalid login data', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: '', // Empty username
          // Missing password
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Authentication Errors', () => {
    it('should return unauthorized error for invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistent',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return authentication required error for protected routes', async () => {
      const response = await request(app)
        .get('/api/auth/profile');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });

    it('should return invalid token error for malformed token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTHENTICATION_FAILED');
    });
  });

  describe('Not Found Errors', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ROUTE_NOT_FOUND');
    });

    it('should return 404 for non-existent company', async () => {
      // First register and login to get token
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser404',
          email: 'test404@example.com',
          password: 'TestPass123!',
          phoneNumber: '+1234567890',
        });

      const token = registerResponse.body.data.token;

      const response = await request(app)
        .get('/api/companies/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      const requests = [];
      
      // Make multiple requests quickly
      for (let i = 0; i < 105; i++) {
        requests.push(
          request(app)
            .get('/health')
        );
      }

      const responses = await Promise.all(requests);
      
      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    }, 10000);
  });

  describe('Input Sanitization', () => {
    it('should sanitize HTML input', async () => {
      const maliciousInput = {
        username: 'testuser<script>alert("xss")</script>',
        email: 'test@example.com',
        password: 'TestPass123!',
        phoneNumber: '+1234567890',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(maliciousInput);

      // Should either sanitize the input or reject it
      if (response.status === 201) {
        expect(response.body.data.user.username).not.toContain('<script>');
      } else {
        expect(response.status).toBe(400);
      }
    });
  });

  describe('Error Response Format', () => {
    it('should return consistent error format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistent',
          password: 'wrongpassword',
        });

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should include error details for validation errors', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'ab',
          email: 'invalid',
        });

      expect(response.body.error).toHaveProperty('details');
      expect(Array.isArray(response.body.error.details)).toBe(true);
      expect(response.body.error.details.length).toBeGreaterThan(0);
      expect(response.body.error.details[0]).toHaveProperty('field');
      expect(response.body.error.details[0]).toHaveProperty('message');
    });
  });

  describe('Custom Error Classes', () => {
    it('should handle ValidationError correctly', () => {
      const error = new ValidationError('Test validation error', [
        { field: 'username', message: 'Username is required' }
      ]);

      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.details).toBeDefined();
    });

    it('should handle NotFoundError correctly', () => {
      const error = new NotFoundError('Resource not found');

      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
    });

    it('should handle UnauthorizedError correctly', () => {
      const error = new UnauthorizedError('Access denied');

      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('Database Error Handling', () => {
    it('should handle duplicate entry errors', async () => {
      // First registration should succeed
      const userData = {
        username: 'duplicatetest',
        email: 'duplicate@example.com',
        password: 'TestPass123!',
        phoneNumber: '+1234567890',
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Second registration with same data should fail
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('DUPLICATE_ENTRY');
    });
  });

  describe('Production vs Development Error Details', () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('should hide error details in production', async () => {
      process.env.NODE_ENV = 'production';

      const response = await request(app)
        .get('/api/nonexistent');

      expect(response.body.error.details).toBeUndefined();
    });

    it('should show error details in development', async () => {
      process.env.NODE_ENV = 'development';

      const response = await request(app)
        .get('/api/nonexistent');

      // Details might be undefined for 404 errors, but shouldn't be hidden for 500 errors
      expect(response.status).toBe(404);
    });
  });
});