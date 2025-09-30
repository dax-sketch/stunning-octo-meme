import request from 'supertest';
import app from '../server';
import prisma from '../lib/prisma';
import { UserModel } from '../models/User';
import { CompanyModel } from '../models/Company';
import { AuditModel } from '../models/Audit';
import { AuditStatus } from '@prisma/client';
import jwt from 'jsonwebtoken';

describe('Audit Integration Tests', () => {
  let authToken: string;
  let testUser: any;
  let testCompany: any;

  beforeAll(async () => {
    // Create test user
    testUser = await UserModel.create({
      username: 'auditintegrationuser',
      email: 'auditintegration@test.com',
      phoneNumber: '+1234567890',
      password: 'password123',
    });

    // Generate auth token
    authToken = jwt.sign(
      { userId: testUser.id, username: testUser.username },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    // Create test company
    testCompany = await CompanyModel.create({
      name: 'Test Integration Company',
      startDate: new Date('2024-01-01'),
      phoneNumber: '+1234567890',
      email: 'integration@test.com',
      website: 'https://integration.com',
      createdBy: testUser.id,
    });
  });

  afterAll(async () => {
    // Clean up
    await prisma.audit.deleteMany({});
    await prisma.company.deleteMany({});
    await prisma.user.deleteMany({});
  });

  afterEach(async () => {
    // Clean up audits after each test
    await prisma.audit.deleteMany({});
  });

  describe('POST /api/audits', () => {
    it('should create a new audit with authentication', async () => {
      const auditData = {
        companyId: testCompany.id,
        scheduledDate: '2024-02-01T10:00:00.000Z',
        assignedTo: testUser.id,
        notes: 'Integration test audit',
      };

      const response = await request(app)
        .post('/api/audits')
        .set('Authorization', `Bearer ${authToken}`)
        .send(auditData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.companyId).toBe(testCompany.id);
      expect(response.body.data.assignedTo).toBe(testUser.id);
      expect(response.body.data.status).toBe(AuditStatus.SCHEDULED);
    });

    it('should reject request without authentication', async () => {
      const auditData = {
        companyId: testCompany.id,
        scheduledDate: '2024-02-01T10:00:00.000Z',
        assignedTo: testUser.id,
      };

      const response = await request(app)
        .post('/api/audits')
        .send(auditData);

      expect(response.status).toBe(401);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/audits')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          companyId: testCompany.id,
          // Missing scheduledDate and assignedTo
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/audits', () => {
    beforeEach(async () => {
      // Create test audits
      await AuditModel.create({
        companyId: testCompany.id,
        scheduledDate: new Date('2024-02-01'),
        assignedTo: testUser.id,
        notes: 'First audit',
      });

      await AuditModel.create({
        companyId: testCompany.id,
        scheduledDate: new Date('2024-03-01'),
        assignedTo: testUser.id,
        notes: 'Second audit',
      });
    });

    it('should get all audits', async () => {
      const response = await request(app)
        .get('/api/audits')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    it('should filter audits by company', async () => {
      const response = await request(app)
        .get('/api/audits')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ companyId: testCompany.id });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.every((audit: any) => audit.companyId === testCompany.id)).toBe(true);
    });

    it('should filter audits by status', async () => {
      const response = await request(app)
        .get('/api/audits')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ status: 'SCHEDULED' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.every((audit: any) => audit.status === 'SCHEDULED')).toBe(true);
    });
  });

  describe('GET /api/audits/:id', () => {
    it('should get audit by ID', async () => {
      const audit = await AuditModel.create({
        companyId: testCompany.id,
        scheduledDate: new Date('2024-02-01'),
        assignedTo: testUser.id,
      });

      const response = await request(app)
        .get(`/api/audits/${audit.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(audit.id);
      expect(response.body.data.company).toBeDefined();
      expect(response.body.data.assignee).toBeDefined();
    });

    it('should return 404 for non-existent audit', async () => {
      const response = await request(app)
        .get('/api/audits/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/audits/:id', () => {
    it('should update audit', async () => {
      const audit = await AuditModel.create({
        companyId: testCompany.id,
        scheduledDate: new Date('2024-02-01'),
        assignedTo: testUser.id,
        notes: 'Original notes',
      });

      const updateData = {
        notes: 'Updated notes',
        status: 'COMPLETED',
      };

      const response = await request(app)
        .put(`/api/audits/${audit.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.notes).toBe('Updated notes');
      expect(response.body.data.status).toBe('COMPLETED');
    });
  });

  describe('DELETE /api/audits/:id', () => {
    it('should delete audit', async () => {
      const audit = await AuditModel.create({
        companyId: testCompany.id,
        scheduledDate: new Date('2024-02-01'),
        assignedTo: testUser.id,
      });

      const response = await request(app)
        .delete(`/api/audits/${audit.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify audit was deleted
      const deletedAudit = await AuditModel.findById(audit.id);
      expect(deletedAudit).toBeNull();
    });
  });

  describe('GET /api/audits/company/:companyId', () => {
    it('should get audits for specific company', async () => {
      await AuditModel.create({
        companyId: testCompany.id,
        scheduledDate: new Date('2024-02-01'),
        assignedTo: testUser.id,
      });

      await AuditModel.create({
        companyId: testCompany.id,
        scheduledDate: new Date('2024-03-01'),
        assignedTo: testUser.id,
      });

      const response = await request(app)
        .get(`/api/audits/company/${testCompany.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.every((audit: any) => audit.companyId === testCompany.id)).toBe(true);
    });
  });

  describe('POST /api/audits/:id/complete', () => {
    it('should mark audit as completed', async () => {
      const audit = await AuditModel.create({
        companyId: testCompany.id,
        scheduledDate: new Date('2024-02-01'),
        assignedTo: testUser.id,
      });

      const response = await request(app)
        .post(`/api/audits/${audit.id}/complete`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ notes: 'Audit completed successfully' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('COMPLETED');
      expect(response.body.data.completedDate).toBeDefined();
      expect(response.body.data.notes).toBe('Audit completed successfully');

      // Verify next audit was scheduled
      const allAudits = await AuditModel.findByCompanyId(testCompany.id);
      expect(allAudits.length).toBeGreaterThan(1);
    });
  });

  describe('POST /api/audits/schedule/initial', () => {
    it('should schedule initial audits for company', async () => {
      const response = await request(app)
        .post('/api/audits/schedule/initial')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          companyId: testCompany.id,
          assignedTo: testUser.id,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].companyId).toBe(testCompany.id);
      expect(response.body.message).toBe('Initial audits scheduled successfully');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/audits/schedule/initial')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          companyId: testCompany.id,
          // Missing assignedTo
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/audits/schedule/update-all', () => {
    it('should update audit schedules for all companies', async () => {
      const response = await request(app)
        .post('/api/audits/schedule/update-all')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.updated).toBeDefined();
      expect(response.body.data.created).toBeDefined();
      expect(response.body.message).toBe('Audit schedules updated successfully');
    });
  });

  describe('GET /api/audits/upcoming', () => {
    it('should get upcoming audits', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 3);

      await AuditModel.create({
        companyId: testCompany.id,
        scheduledDate: futureDate,
        assignedTo: testUser.id,
      });

      const response = await request(app)
        .get('/api/audits/upcoming')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });

    it('should get upcoming audits with custom days', async () => {
      const response = await request(app)
        .get('/api/audits/upcoming?days=14')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/audits/statistics', () => {
    beforeEach(async () => {
      // Create various audits for statistics
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 3);

      // Overdue audit
      await AuditModel.create({
        companyId: testCompany.id,
        scheduledDate: pastDate,
        assignedTo: testUser.id,
      });

      // Upcoming audit
      await AuditModel.create({
        companyId: testCompany.id,
        scheduledDate: futureDate,
        assignedTo: testUser.id,
      });

      // Completed audit
      const completedAudit = await AuditModel.create({
        companyId: testCompany.id,
        scheduledDate: new Date('2024-01-15'),
        assignedTo: testUser.id,
      });

      await AuditModel.markCompleted(completedAudit.id);
    });

    it('should get audit statistics', async () => {
      const response = await request(app)
        .get('/api/audits/statistics')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.total).toBe(3);
      expect(response.body.data.completed).toBe(1);
      expect(response.body.data.scheduled).toBe(2);
      expect(response.body.data.upcomingWeek).toBe(1);
    });
  });

  describe('POST /api/audits/process-overdue', () => {
    it('should process overdue audits', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);

      await AuditModel.create({
        companyId: testCompany.id,
        scheduledDate: pastDate,
        assignedTo: testUser.id,
      });

      const response = await request(app)
        .post('/api/audits/process-overdue')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.markedCount).toBe(1);
      expect(response.body.data.audits).toHaveLength(1);
      expect(response.body.message).toBe('Overdue audits processed successfully');
    });
  });

  describe('Audit Scheduling Algorithm Tests', () => {
    it('should schedule weekly audits for new companies', async () => {
      // Create a company that's 1 month old
      const newCompany = await CompanyModel.create({
        name: 'New Company',
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        phoneNumber: '+1234567890',
        email: 'new@test.com',
        website: 'https://new.com',
        createdBy: testUser.id,
      });

      const response = await request(app)
        .post('/api/audits/schedule/initial')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          companyId: newCompany.id,
          assignedTo: testUser.id,
        });

      expect(response.status).toBe(201);
      
      const audit = response.body.data[0];
      const scheduledDate = new Date(audit.scheduledDate);
      const today = new Date();
      const daysDifference = Math.ceil((scheduledDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      // Should be scheduled within 7 days (weekly for new companies)
      expect(daysDifference).toBeLessThanOrEqual(7);
      expect(daysDifference).toBeGreaterThan(0);
    });

    it('should schedule monthly audits for medium-age companies', async () => {
      // Create a company that's 6 months old
      const mediumCompany = await CompanyModel.create({
        name: 'Medium Company',
        startDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), // 180 days ago
        phoneNumber: '+1234567890',
        email: 'medium@test.com',
        website: 'https://medium.com',
        createdBy: testUser.id,
      });

      const response = await request(app)
        .post('/api/audits/schedule/initial')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          companyId: mediumCompany.id,
          assignedTo: testUser.id,
        });

      expect(response.status).toBe(201);
      
      const audit = response.body.data[0];
      const scheduledDate = new Date(audit.scheduledDate);
      const today = new Date();
      const daysDifference = Math.ceil((scheduledDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      // Should be scheduled around 30 days (monthly for medium-age companies)
      expect(daysDifference).toBeGreaterThan(20);
      expect(daysDifference).toBeLessThanOrEqual(35);
    });
  });
});