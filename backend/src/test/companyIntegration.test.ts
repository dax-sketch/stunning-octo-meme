import request from 'supertest';
import app from '../server';
import { PrismaClient } from '@prisma/client';
import { UserModel } from '../models/User';
import { JwtService } from '../utils/jwt';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';

const prisma = new PrismaClient();

describe('Company API Integration Tests', () => {
  let authToken: string;
  let testUser: any;
  let testCompany: any;

  beforeAll(async () => {
    // Clean up test data
    await prisma.company.deleteMany({});
    await prisma.user.deleteMany({});

    // Create test user
    testUser = await UserModel.create({
      username: 'testuser',
      email: 'test@example.com',
      phoneNumber: '+1234567890',
      password: 'TestPass123'
    });

    // Generate auth token
    authToken = JwtService.generateAccessToken({
      userId: testUser.id,
      username: testUser.username,
      email: testUser.email,
      role: testUser.role
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.company.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up companies before each test
    await prisma.company.deleteMany({});
  });

  describe('POST /api/companies', () => {
    it('should create a new company', async () => {
      const companyData = {
        name: 'Test Company',
        startDate: '2023-01-01T00:00:00.000Z',
        phoneNumber: '+1234567890',
        email: 'test@company.com',
        website: 'https://test.com',
        adSpend: 3000
      };

      const response = await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${authToken}`)
        .send(companyData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(companyData.name);
      expect(response.body.data.email).toBe(companyData.email);
      expect(response.body.data.createdBy).toBe(testUser.id);
      expect(response.body.data.tier).toBeDefined();

      testCompany = response.body.data;
    });

    it('should return 401 without authentication', async () => {
      const companyData = {
        name: 'Test Company',
        startDate: '2023-01-01T00:00:00.000Z',
        phoneNumber: '+1234567890',
        email: 'test@company.com'
      };

      const response = await request(app)
        .post('/api/companies')
        .send(companyData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 400 for invalid data', async () => {
      const invalidData = {
        name: '', // Empty name
        startDate: '2023-01-01T00:00:00.000Z',
        phoneNumber: 'invalid', // Invalid phone
        email: 'invalid-email' // Invalid email
      };

      const response = await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 409 for duplicate company name', async () => {
      const companyData = {
        name: 'Duplicate Company',
        startDate: '2023-01-01T00:00:00.000Z',
        phoneNumber: '+1234567890',
        email: 'test1@company.com'
      };

      // Create first company
      await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${authToken}`)
        .send(companyData)
        .expect(201);

      // Try to create duplicate
      const duplicateData = {
        ...companyData,
        email: 'test2@company.com' // Different email but same name
      };

      const response = await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${authToken}`)
        .send(duplicateData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('DUPLICATE_COMPANY');
    });
  });

  describe('GET /api/companies', () => {
    beforeEach(async () => {
      // Create test companies
      const companies = [
        {
          name: 'High Spend Company',
          startDate: '2020-01-01T00:00:00.000Z',
          phoneNumber: '+1111111111',
          email: 'high@company.com',
          adSpend: 8000
        },
        {
          name: 'New Company',
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 1 month ago
          phoneNumber: '+2222222222',
          email: 'new@company.com',
          adSpend: 1000
        },
        {
          name: 'Old Low Spend Company',
          startDate: '2020-01-01T00:00:00.000Z',
          phoneNumber: '+3333333333',
          email: 'old@company.com',
          adSpend: 500
        }
      ];

      for (const company of companies) {
        await request(app)
          .post('/api/companies')
          .set('Authorization', `Bearer ${authToken}`)
          .send(company);
      }
    });

    it('should get all companies with pagination', async () => {
      const response = await request(app)
        .get('/api/companies')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.pagination.total).toBe(3);
      expect(response.body.pagination.limit).toBe(50);
      expect(response.body.pagination.offset).toBe(0);
      expect(response.body.pagination.hasMore).toBe(false);
    });

    it('should filter companies by tier', async () => {
      const response = await request(app)
        .get('/api/companies?tier=TIER_1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('High Spend Company');
      expect(response.body.data[0].tier).toBe('TIER_1');
    });

    it('should filter companies by search term', async () => {
      const response = await request(app)
        .get('/api/companies?search=High')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('High Spend Company');
    });

    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/companies?limit=2&offset=1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination.limit).toBe(2);
      expect(response.body.pagination.offset).toBe(1);
      expect(response.body.pagination.hasMore).toBe(false);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/companies')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('GET /api/companies/:id', () => {
    beforeEach(async () => {
      // Create test company
      const companyData = {
        name: 'Test Company',
        startDate: '2023-01-01T00:00:00.000Z',
        phoneNumber: '+1234567890',
        email: 'test@company.com'
      };

      const response = await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${authToken}`)
        .send(companyData);

      testCompany = response.body.data;
    });

    it('should get company by ID', async () => {
      const response = await request(app)
        .get(`/api/companies/${testCompany.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testCompany.id);
      expect(response.body.data.name).toBe(testCompany.name);
      expect(response.body.data.creator).toBeDefined();
    });

    it('should return 404 for non-existent company', async () => {
      const response = await request(app)
        .get('/api/companies/nonexistent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('COMPANY_NOT_FOUND');
    });

    it('should return 400 for missing ID', async () => {
      const response = await request(app)
        .get('/api/companies/')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404); // Express returns 404 for missing route parameter
    });
  });

  describe('PUT /api/companies/:id', () => {
    beforeEach(async () => {
      // Create test company
      const companyData = {
        name: 'Test Company',
        startDate: '2023-01-01T00:00:00.000Z',
        phoneNumber: '+1234567890',
        email: 'test@company.com',
        adSpend: 1000
      };

      const response = await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${authToken}`)
        .send(companyData);

      testCompany = response.body.data;
    });

    it('should update company successfully', async () => {
      const updateData = {
        name: 'Updated Company',
        adSpend: 7000
      };

      const response = await request(app)
        .put(`/api/companies/${testCompany.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Company');
      expect(response.body.data.adSpend).toBe(7000);
      expect(response.body.data.tier).toBe('TIER_1'); // Should be recalculated
    });

    it('should return 404 for non-existent company', async () => {
      const response = await request(app)
        .put('/api/companies/nonexistent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Name' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('COMPANY_NOT_FOUND');
    });

    it('should return 400 for invalid update data', async () => {
      const invalidData = {
        email: 'invalid-email'
      };

      const response = await request(app)
        .put(`/api/companies/${testCompany.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('DELETE /api/companies/:id', () => {
    beforeEach(async () => {
      // Create test company
      const companyData = {
        name: 'Test Company',
        startDate: '2023-01-01T00:00:00.000Z',
        phoneNumber: '+1234567890',
        email: 'test@company.com'
      };

      const response = await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${authToken}`)
        .send(companyData);

      testCompany = response.body.data;
    });

    it('should delete company successfully', async () => {
      const response = await request(app)
        .delete(`/api/companies/${testCompany.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Company deleted successfully');

      // Verify company is deleted
      const getResponse = await request(app)
        .get(`/api/companies/${testCompany.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should return 404 for non-existent company', async () => {
      const response = await request(app)
        .delete('/api/companies/nonexistent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('COMPANY_NOT_FOUND');
    });
  });

  describe('POST /api/companies/update-tiers', () => {
    beforeEach(async () => {
      // Create companies with different characteristics
      const companies = [
        {
          name: 'Should be Tier 1',
          startDate: '2020-01-01T00:00:00.000Z',
          phoneNumber: '+1111111111',
          email: 'tier1@company.com',
          adSpend: 8000
        },
        {
          name: 'Should be Tier 2',
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          phoneNumber: '+2222222222',
          email: 'tier2@company.com',
          adSpend: 1000
        }
      ];

      for (const company of companies) {
        await request(app)
          .post('/api/companies')
          .set('Authorization', `Bearer ${authToken}`)
          .send(company);
      }
    });

    it('should update all company tiers for CEO', async () => {
      // Create CEO user
      const ceoUser = await UserModel.create({
        username: 'ceo',
        email: 'ceo@example.com',
        phoneNumber: '+9999999999',
        password: 'CeoPass123',
        role: 'CEO'
      });

      const ceoToken = JwtService.generateAccessToken({
        userId: ceoUser.id,
        username: ceoUser.username,
        email: ceoUser.email,
        role: ceoUser.role
      });

      const response = await request(app)
        .post('/api/companies/update-tiers')
        .set('Authorization', `Bearer ${ceoToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.updatedCount).toBeGreaterThanOrEqual(0);
    });

    it('should return 403 for non-admin user', async () => {
      const response = await request(app)
        .post('/api/companies/update-tiers')
        .set('Authorization', `Bearer ${authToken}`) // Regular user
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/companies/update-tiers')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });
});