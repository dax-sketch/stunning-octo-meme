import request from 'supertest';
import app from './server';

describe('Server Setup', () => {
  it('should respond to health check', async () => {
    const response = await request(app).get('/health');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'OK');
    expect(response.body).toHaveProperty('message');
    expect(response.body).toHaveProperty('timestamp');
  });

  it('should respond to API root', async () => {
    const response = await request(app).get('/api');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message');
    expect(response.body).toHaveProperty('version');
  });

  it('should handle 404 routes', async () => {
    const response = await request(app).get('/nonexistent-route');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body.error).toHaveProperty('code', 'NOT_FOUND');
  });
});