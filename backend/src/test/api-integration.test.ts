import request from 'supertest';
import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import app from '../server';
import { JwtService } from '../utils/jwt';

describe('API Integration Tests', () => {
  let app: Express;
  let prisma: PrismaClient;
  let authToken: string;
  let testUserId: string;

  beforeAll(async () => {
    // Create test app with test database
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/client_management_test';
    
    // app is imported directly
    prisma = new PrismaClient();
    
    // Connect to test database
    await prisma.$connect();
  });

  beforeEach(async () => {
    // Clean database before each test
    await prisma.notification.deleteMany();
    await prisma.audit.deleteMany();
    await prisma.note.deleteMany();
    await prisma.company.deleteMany();
    await prisma.user.deleteMany();

    // Create test user
    const testUser = await prisma.user.create({
      data: {
        username: 'testuser',
        email: 'test@example.com',
        phoneNumber: '+1234567890',
        password: '$2a$10$hashedpassword', // bcrypt hash for 'password123'
        role: 'TEAM_MEMBER',
        emailNotifications: true,
        smsNotifications: false,
        meetingReminders: true,
        auditReminders: true,
      },
    });

    testUserId = testUser.id;
    authToken = JwtService.generateAccessToken({ 
      userId: testUser.id, 
      username: testUser.username, 
      email: testUser.email, 
      role: testUser.role 
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Authentication Endpoints', () => {
    it('POST /api/auth/register - should register a new user', async () => {
      const userData = {
        username: 'newuser',
        email: 'newuser@example.com',
        phoneNumber: '+1987654321',
        password: 'password123',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.username).toBe(userData.username);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.token).toBeDefined();

      // Verify user was created in database
      const user = await prisma.user.findUnique({
        where: { username: userData.username },
      });
      expect(user).toBeTruthy();
    });

    it('POST /api/auth/login - should login with valid credentials', async () => {
      const loginData = {
        username: 'testuser',
        password: 'password123',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.username).toBe(loginData.username);
      expect(response.body.data.token).toBeDefined();
    });

    it('POST /api/auth/login - should reject invalid credentials', async () => {
      const loginData = {
        username: 'testuser',
        password: 'wrongpassword',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Invalid credentials');
    });
  });

  describe('Company Management Endpoints', () => {
    it('POST /api/companies - should create a new company', async () => {
      const companyData = {
        name: 'Test Company',
        startDate: '2024-01-01',
        phoneNumber: '+1234567890',
        email: 'company@test.com',
        website: 'https://test.com',
      };

      const response = await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${authToken}`)
        .send(companyData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(companyData.name);
      expect(response.body.data.tier).toBeDefined();

      // Verify company was created in database
      const company = await prisma.company.findFirst({
        where: { name: companyData.name },
      });
      expect(company).toBeTruthy();
    });

    it('GET /api/companies - should retrieve companies with pagination', async () => {
      // Create test companies
      await prisma.company.createMany({
        data: [
          {
            name: 'Company 1',
            startDate: new Date('2024-01-01'),
            phoneNumber: '+1234567890',
            email: 'company1@test.com',
            website: 'https://company1.com',
            tier: 'TIER_2',
            adSpend: 5000,
            createdBy: testUserId,
          },
          {
            name: 'Company 2',
            startDate: new Date('2024-02-01'),
            phoneNumber: '+1234567891',
            email: 'company2@test.com',
            website: 'https://company2.com',
            tier: 'TIER_1',
            adSpend: 15000,
            createdBy: testUserId,
          },
        ],
      });

      const response = await request(app)
        .get('/api/companies?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.companies).toHaveLength(2);
      expect(response.body.data.total).toBe(2);
      expect(response.body.data.page).toBe(1);
    });

    it('GET /api/companies/:id - should retrieve specific company', async () => {
      const company = await prisma.company.create({
        data: {
          name: 'Test Company',
          startDate: new Date('2024-01-01'),
          phoneNumber: '+1234567890',
          email: 'company@test.com',
          website: 'https://test.com',
          tier: 'TIER_2',
          adSpend: 5000,
          createdBy: testUserId,
        },
      });

      const response = await request(app)
        .get(`/api/companies/${company.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(company.id);
      expect(response.body.data.name).toBe('Test Company');
    });

    it('PUT /api/companies/:id - should update company', async () => {
      const company = await prisma.company.create({
        data: {
          name: 'Test Company',
          startDate: new Date('2024-01-01'),
          phoneNumber: '+1234567890',
          email: 'company@test.com',
          website: 'https://test.com',
          tier: 'TIER_2',
          adSpend: 5000,
          createdBy: testUserId,
        },
      });

      const updateData = {
        name: 'Updated Company Name',
        adSpend: 10000,
      };

      const response = await request(app)
        .put(`/api/companies/${company.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.adSpend).toBe(updateData.adSpend);

      // Verify update in database
      const updatedCompany = await prisma.company.findUnique({
        where: { id: company.id },
      });
      expect(updatedCompany?.name).toBe(updateData.name);
    });

    it('DELETE /api/companies/:id - should delete company', async () => {
      const company = await prisma.company.create({
        data: {
          name: 'Company to Delete',
          startDate: new Date('2024-01-01'),
          phoneNumber: '+1234567890',
          email: 'delete@test.com',
          website: 'https://delete.com',
          tier: 'TIER_2',
          adSpend: 5000,
          createdBy: testUserId,
        },
      });

      await request(app)
        .delete(`/api/companies/${company.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify deletion in database
      const deletedCompany = await prisma.company.findUnique({
        where: { id: company.id },
      });
      expect(deletedCompany).toBeNull();
    });
  });

  describe('Notes Management Endpoints', () => {
    let testCompanyId: string;

    beforeEach(async () => {
      const company = await prisma.company.create({
        data: {
          name: 'Test Company',
          startDate: new Date('2024-01-01'),
          phoneNumber: '+1234567890',
          email: 'company@test.com',
          website: 'https://test.com',
          tier: 'TIER_2',
          adSpend: 5000,
          createdBy: testUserId,
        },
      });
      testCompanyId = company.id;
    });

    it('POST /api/companies/:id/notes - should create a note', async () => {
      const noteData = {
        content: 'This is a test note.',
      };

      const response = await request(app)
        .post(`/api/companies/${testCompanyId}/notes`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(noteData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.content).toBe(noteData.content);
      expect(response.body.data.companyId).toBe(testCompanyId);
      expect(response.body.data.userId).toBe(testUserId);

      // Verify note was created in database
      const note = await prisma.note.findFirst({
        where: { companyId: testCompanyId },
      });
      expect(note).toBeTruthy();
    });

    it('GET /api/companies/:id/notes - should retrieve company notes', async () => {
      // Create test notes
      await prisma.note.createMany({
        data: [
          {
            content: 'First note',
            companyId: testCompanyId,
            userId: testUserId,
          },
          {
            content: 'Second note',
            companyId: testCompanyId,
            userId: testUserId,
          },
        ],
      });

      const response = await request(app)
        .get(`/api/companies/${testCompanyId}/notes`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].content).toBeDefined();
      expect(response.body.data[0].user).toBeDefined();
    });

    it('PUT /api/notes/:id - should update a note', async () => {
      const note = await prisma.note.create({
        data: {
          content: 'Original note content',
          companyId: testCompanyId,
          userId: testUserId,
        },
      });

      const updateData = {
        content: 'Updated note content',
      };

      const response = await request(app)
        .put(`/api/notes/${note.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.content).toBe(updateData.content);

      // Verify update in database
      const updatedNote = await prisma.note.findUnique({
        where: { id: note.id },
      });
      expect(updatedNote?.content).toBe(updateData.content);
    });

    it('DELETE /api/notes/:id - should delete a note', async () => {
      const note = await prisma.note.create({
        data: {
          content: 'Note to delete',
          companyId: testCompanyId,
          userId: testUserId,
        },
      });

      await request(app)
        .delete(`/api/notes/${note.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify deletion in database
      const deletedNote = await prisma.note.findUnique({
        where: { id: note.id },
      });
      expect(deletedNote).toBeNull();
    });
  });

  describe('Authorization Tests', () => {
    it('should reject requests without authentication token', async () => {
      await request(app)
        .get('/api/companies')
        .expect(401);
    });

    it('should reject requests with invalid token', async () => {
      await request(app)
        .get('/api/companies')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should allow access with valid token', async () => {
      await request(app)
        .get('/api/companies')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });
});