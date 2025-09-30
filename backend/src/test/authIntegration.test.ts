import request from 'supertest';
import app from '../server';

// This is an integration test that tests the actual server
// Note: This requires a test database to be set up
describe('Authentication Integration Tests', () => {
  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('OK');
      expect(response.body.message).toBe('Client Management Platform API is running');
    });
  });

  describe('API Root', () => {
    it('should return API information', async () => {
      const response = await request(app)
        .get('/api');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Welcome to Client Management Platform API');
      expect(response.body.version).toBe('1.0.0');
    });
  });

  describe('Authentication Endpoints', () => {
    it('should have auth routes available', async () => {
      // Test that auth endpoints exist (even if they fail due to no test DB)
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({});

      // Should get a response (even if it's an error due to validation or DB)
      expect([400, 500]).toContain(registerResponse.status);

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({});

      // Should get a response (even if it's an error due to validation or DB)
      expect([400, 500]).toContain(loginResponse.status);
    });

    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });
});