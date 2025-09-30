import request from 'supertest';
import express from 'express';
import { AuditController } from '../controllers/auditController';
import { AuditService } from '../services/auditService';
import { AuditStatus } from '@prisma/client';

// Mock the AuditService
jest.mock('../services/auditService');

describe('AuditController', () => {
  let app: express.Application;
  let auditController: AuditController;
  let mockAuditService: jest.Mocked<AuditService>;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    auditController = new AuditController();
    mockAuditService = new AuditService() as jest.Mocked<AuditService>;
    
    // Replace the service instance
    (auditController as any).auditService = mockAuditService;

    // Set up routes
    app.post('/audits', auditController.createAudit);
    app.get('/audits', auditController.getAudits);
    app.get('/audits/statistics', auditController.getAuditStatistics);
    app.get('/audits/upcoming', auditController.getUpcomingAudits);
    app.get('/audits/:id', auditController.getAuditById);
    app.put('/audits/:id', auditController.updateAudit);
    app.delete('/audits/:id', auditController.deleteAudit);
    app.get('/audits/company/:companyId', auditController.getCompanyAudits);
    app.post('/audits/:id/complete', auditController.completeAudit);
    app.post('/audits/schedule/initial', auditController.scheduleInitialAudits);
    app.post('/audits/schedule/update-all', auditController.updateAllAuditSchedules);
    app.post('/audits/process-overdue', auditController.processOverdueAudits);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /audits', () => {
    it('should create a new audit', async () => {
      const mockAudit = {
        id: 'audit-1',
        companyId: 'company-1',
        scheduledDate: new Date('2024-02-01'),
        assignedTo: 'user-1',
        status: AuditStatus.SCHEDULED,
        notes: 'Test audit',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockAuditService.createAudit.mockResolvedValue(mockAudit as any);

      const response = await request(app)
        .post('/audits')
        .send({
          companyId: 'company-1',
          scheduledDate: '2024-02-01',
          assignedTo: 'user-1',
          notes: 'Test audit',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockAudit);
      expect(mockAuditService.createAudit).toHaveBeenCalledWith({
        companyId: 'company-1',
        scheduledDate: new Date('2024-02-01'),
        assignedTo: 'user-1',
        notes: 'Test audit',
      });
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/audits')
        .send({
          companyId: 'company-1',
          // Missing scheduledDate and assignedTo
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should handle service errors', async () => {
      mockAuditService.createAudit.mockRejectedValue(new Error('Company not found'));

      const response = await request(app)
        .post('/audits')
        .send({
          companyId: 'non-existent',
          scheduledDate: '2024-02-01',
          assignedTo: 'user-1',
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Company not found');
    });
  });

  describe('GET /audits', () => {
    it('should get all audits with filters', async () => {
      const mockAudits = [
        {
          id: 'audit-1',
          companyId: 'company-1',
          status: AuditStatus.SCHEDULED,
        },
      ];

      mockAuditService.getAudits.mockResolvedValue(mockAudits as any);

      const response = await request(app)
        .get('/audits')
        .query({
          companyId: 'company-1',
          status: 'SCHEDULED',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockAudits);
      expect(mockAuditService.getAudits).toHaveBeenCalledWith({
        companyId: 'company-1',
        status: 'SCHEDULED',
      });
    });

    it('should handle service errors', async () => {
      mockAuditService.getAudits.mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/audits');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /audits/:id', () => {
    it('should get audit by ID', async () => {
      const mockAudit = {
        id: 'audit-1',
        companyId: 'company-1',
        status: AuditStatus.SCHEDULED,
      };

      mockAuditService.getAuditById.mockResolvedValue(mockAudit as any);

      const response = await request(app).get('/audits/audit-1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockAudit);
    });

    it('should return 404 for non-existent audit', async () => {
      mockAuditService.getAuditById.mockResolvedValue(null);

      const response = await request(app).get('/audits/non-existent');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUDIT_NOT_FOUND');
    });
  });

  describe('PUT /audits/:id', () => {
    it('should update audit', async () => {
      const mockUpdatedAudit = {
        id: 'audit-1',
        notes: 'Updated notes',
        status: AuditStatus.COMPLETED,
      };

      mockAuditService.updateAudit.mockResolvedValue(mockUpdatedAudit as any);

      const response = await request(app)
        .put('/audits/audit-1')
        .send({
          notes: 'Updated notes',
          status: 'COMPLETED',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockUpdatedAudit);
    });

    it('should return 404 for non-existent audit', async () => {
      mockAuditService.updateAudit.mockResolvedValue(null);

      const response = await request(app)
        .put('/audits/non-existent')
        .send({ notes: 'Updated notes' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /audits/:id', () => {
    it('should delete audit', async () => {
      mockAuditService.deleteAudit.mockResolvedValue(true);

      const response = await request(app).delete('/audits/audit-1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Audit deleted successfully');
    });

    it('should return 404 for non-existent audit', async () => {
      mockAuditService.deleteAudit.mockResolvedValue(false);

      const response = await request(app).delete('/audits/non-existent');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /audits/company/:companyId', () => {
    it('should get audits for specific company', async () => {
      const mockAudits = [
        { id: 'audit-1', companyId: 'company-1' },
        { id: 'audit-2', companyId: 'company-1' },
      ];

      mockAuditService.getAuditsByCompany.mockResolvedValue(mockAudits as any);

      const response = await request(app).get('/audits/company/company-1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockAudits);
    });
  });

  describe('POST /audits/:id/complete', () => {
    it('should mark audit as completed', async () => {
      const mockCompletedAudit = {
        id: 'audit-1',
        status: AuditStatus.COMPLETED,
        completedDate: new Date(),
      };

      mockAuditService.completeAudit.mockResolvedValue(mockCompletedAudit as any);

      const response = await request(app)
        .post('/audits/audit-1/complete')
        .send({ notes: 'Audit completed' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockCompletedAudit);
      expect(response.body.message).toBe('Audit marked as completed');
    });

    it('should return 404 for non-existent audit', async () => {
      mockAuditService.completeAudit.mockResolvedValue(null);

      const response = await request(app).post('/audits/non-existent/complete');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /audits/schedule/initial', () => {
    it('should schedule initial audits for company', async () => {
      const mockAudits = [
        { id: 'audit-1', companyId: 'company-1' },
      ];

      mockAuditService.scheduleInitialAudits.mockResolvedValue(mockAudits as any);

      const response = await request(app)
        .post('/audits/schedule/initial')
        .send({
          companyId: 'company-1',
          assignedTo: 'user-1',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockAudits);
      expect(response.body.message).toBe('Initial audits scheduled successfully');
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/audits/schedule/initial')
        .send({ companyId: 'company-1' }); // Missing assignedTo

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /audits/schedule/update-all', () => {
    it('should update all audit schedules', async () => {
      const mockResult = { updated: 5, created: 3 };

      mockAuditService.updateAuditSchedulesForAllCompanies.mockResolvedValue(mockResult);

      const response = await request(app).post('/audits/schedule/update-all');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockResult);
      expect(response.body.message).toBe('Audit schedules updated successfully');
    });
  });

  describe('GET /audits/upcoming', () => {
    it('should get upcoming audits with default days', async () => {
      const mockAudits = [
        { id: 'audit-1', scheduledDate: new Date() },
      ];

      mockAuditService.getUpcomingAudits.mockResolvedValue(mockAudits as any);

      const response = await request(app).get('/audits/upcoming');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockAudits);
      expect(mockAuditService.getUpcomingAudits).toHaveBeenCalledWith(7);
    });

    it('should get upcoming audits with custom days', async () => {
      const mockAudits = [
        { id: 'audit-1', scheduledDate: new Date() },
      ];

      mockAuditService.getUpcomingAudits.mockResolvedValue(mockAudits as any);

      const response = await request(app).get('/audits/upcoming?days=14');

      expect(response.status).toBe(200);
      expect(mockAuditService.getUpcomingAudits).toHaveBeenCalledWith(14);
    });
  });

  describe('GET /audits/statistics', () => {
    it('should get audit statistics', async () => {
      const mockStats = {
        total: 10,
        scheduled: 5,
        completed: 3,
        overdue: 2,
        upcomingWeek: 4,
      };

      mockAuditService.getAuditStatistics.mockResolvedValue(mockStats);

      const response = await request(app).get('/audits/statistics');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockStats);
    });
  });

  describe('POST /audits/process-overdue', () => {
    it('should process overdue audits', async () => {
      const mockResult = {
        audits: [{ id: 'audit-1' }],
        markedCount: 1,
      };

      mockAuditService.processOverdueAudits.mockResolvedValue(mockResult as any);

      const response = await request(app).post('/audits/process-overdue');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockResult);
      expect(response.body.message).toBe('Overdue audits processed successfully');
    });
  });
});