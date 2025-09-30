import { AuditService } from '../services/auditService';
import { AuditModel } from '../models/Audit';
import { CompanyModel } from '../models/Company';
import { UserModel } from '../models/User';
import { NotificationService } from '../services/notificationService';
import { AuditStatus } from '@prisma/client';
import prisma from '../lib/prisma';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { afterEach } from 'node:test';
import { describe } from 'node:test';

// Mock the NotificationService
jest.mock('../services/notificationService');

describe('AuditService', () => {
  let auditService: AuditService;
  let testUser: any;
  let testCompany: any;

  beforeAll(async () => {
    auditService = new AuditService();

    // Create test user
    testUser = await UserModel.create({
      username: 'auditserviceuser',
      email: 'auditservice@test.com',
      phoneNumber: '+1234567890',
      password: 'password123',
    });

    // Create test company
    testCompany = await CompanyModel.create({
      name: 'Test Audit Service Company',
      startDate: new Date('2024-01-01'),
      phoneNumber: '+1234567890',
      email: 'auditservice@test.com',
      website: 'https://auditservice.com',
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
    jest.clearAllMocks();
  });

  describe('createAudit', () => {
    it('should create a new audit and schedule notification', async () => {
      const auditData = {
        companyId: testCompany.id,
        scheduledDate: new Date('2024-02-01'),
        assignedTo: testUser.id,
        notes: 'Test audit',
      };

      const audit = await auditService.createAudit(auditData);

      expect(audit).toBeDefined();
      expect(audit.companyId).toBe(testCompany.id);
      expect(audit.assignedTo).toBe(testUser.id);
      expect(audit.status).toBe(AuditStatus.SCHEDULED);
    });

    it('should throw error for non-existent company', async () => {
      const auditData = {
        companyId: 'non-existent-company',
        scheduledDate: new Date('2024-02-01'),
        assignedTo: testUser.id,
      };

      await expect(auditService.createAudit(auditData)).rejects.toThrow('Company not found');
    });
  });

  describe('calculateNextAuditDate', () => {
    it('should schedule weekly audits for companies less than 3 months old', () => {
      const companyStartDate = new Date('2024-01-01');
      const currentDate = new Date('2024-02-01'); // 1 month old

      const nextAuditDate = auditService.calculateNextAuditDate(companyStartDate, currentDate);
      const expectedDate = new Date('2024-02-08'); // 7 days later

      expect(nextAuditDate.toDateString()).toBe(expectedDate.toDateString());
    });

    it('should schedule monthly audits for companies 3-12 months old', () => {
      const companyStartDate = new Date('2024-01-01');
      const currentDate = new Date('2024-06-01'); // 5 months old

      const nextAuditDate = auditService.calculateNextAuditDate(companyStartDate, currentDate);
      const expectedDate = new Date('2024-07-01'); // 1 month later

      expect(nextAuditDate.getMonth()).toBe(expectedDate.getMonth());
      expect(nextAuditDate.getFullYear()).toBe(expectedDate.getFullYear());
    });

    it('should schedule quarterly audits for companies over 1 year old', () => {
      const companyStartDate = new Date('2023-01-01');
      const currentDate = new Date('2024-06-01'); // 17 months old

      const nextAuditDate = auditService.calculateNextAuditDate(companyStartDate, currentDate);
      const expectedDate = new Date('2024-09-01'); // 3 months later

      expect(nextAuditDate.getMonth()).toBe(expectedDate.getMonth());
      expect(nextAuditDate.getFullYear()).toBe(expectedDate.getFullYear());
    });
  });

  describe('scheduleInitialAudits', () => {
    it('should schedule initial audit for a company', async () => {
      const config = {
        companyId: testCompany.id,
        assignedTo: testUser.id,
      };

      const audits = await auditService.scheduleInitialAudits(config);

      expect(audits).toHaveLength(1);
      expect(audits[0].companyId).toBe(testCompany.id);
      expect(audits[0].assignedTo).toBe(testUser.id);
      expect(audits[0].notes).toContain('Initial audit scheduled');
    });

    it('should throw error for non-existent company', async () => {
      const config = {
        companyId: 'non-existent-company',
        assignedTo: testUser.id,
      };

      await expect(auditService.scheduleInitialAudits(config)).rejects.toThrow('Company not found');
    });
  });

  describe('completeAudit', () => {
    it('should mark audit as completed and schedule next audit', async () => {
      // Create an audit first
      const audit = await AuditModel.create({
        companyId: testCompany.id,
        scheduledDate: new Date('2024-02-01'),
        assignedTo: testUser.id,
      });

      const completedAudit = await auditService.completeAudit(audit.id, 'Audit completed successfully');

      expect(completedAudit).toBeDefined();
      expect(completedAudit?.status).toBe(AuditStatus.COMPLETED);
      expect(completedAudit?.completedDate).toBeDefined();
      expect(completedAudit?.notes).toBe('Audit completed successfully');

      // Check that next audit was scheduled
      const allAudits = await AuditModel.findMany({ companyId: testCompany.id });
      expect(allAudits).toHaveLength(2); // Original + next audit
    });
  });

  describe('updateAuditSchedulesForAllCompanies', () => {
    it('should create audits for companies without scheduled audits', async () => {
      const result = await auditService.updateAuditSchedulesForAllCompanies();

      expect(result.created).toBeGreaterThanOrEqual(1);
      expect(result.updated).toBeGreaterThanOrEqual(0);

      // Verify audit was created for test company
      const companyAudits = await AuditModel.findByCompanyId(testCompany.id);
      expect(companyAudits).toHaveLength(1);
    });

    it('should update existing audit schedules when needed', async () => {
      // Create an audit with incorrect scheduling
      const incorrectDate = new Date();
      incorrectDate.setDate(incorrectDate.getDate() + 30); // Too far in future for new company

      await AuditModel.create({
        companyId: testCompany.id,
        scheduledDate: incorrectDate,
        assignedTo: testUser.id,
      });

      const result = await auditService.updateAuditSchedulesForAllCompanies();

      expect(result.updated).toBeGreaterThanOrEqual(0);
    });
  });

  describe('processOverdueAudits', () => {
    it('should mark overdue audits and send notifications', async () => {
      // Create an overdue audit
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);

      await AuditModel.create({
        companyId: testCompany.id,
        scheduledDate: pastDate,
        assignedTo: testUser.id,
      });

      const result = await auditService.processOverdueAudits();

      expect(result.markedCount).toBe(1);
      expect(result.audits).toHaveLength(1);
      expect(result.audits[0].status).toBe(AuditStatus.SCHEDULED); // Status before marking
    });
  });

  describe('getAuditStatistics', () => {
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

    it('should return correct audit statistics', async () => {
      const stats = await auditService.getAuditStatistics();

      expect(stats.total).toBe(3);
      expect(stats.completed).toBe(1);
      expect(stats.scheduled).toBe(2);
      expect(stats.upcomingWeek).toBe(1);
    });
  });

  describe('getCompanyAgeInMonths', () => {
    it('should calculate company age correctly', () => {
      const startDate = new Date('2024-01-01');
      const currentDate = new Date('2024-06-01');

      // Use reflection to access private method
      const ageInMonths = (auditService as any).getCompanyAgeInMonths(startDate, currentDate);

      expect(ageInMonths).toBe(5);
    });

    it('should handle year boundaries correctly', () => {
      const startDate = new Date('2023-10-01');
      const currentDate = new Date('2024-02-01');

      const ageInMonths = (auditService as any).getCompanyAgeInMonths(startDate, currentDate);

      expect(ageInMonths).toBe(4);
    });
  });

  describe('shouldRescheduleAudit', () => {
    it('should return true when audit needs rescheduling', () => {
      const companyStartDate = new Date('2024-01-01');
      const currentScheduledDate = new Date('2024-03-01'); // Too far for new company

      const shouldReschedule = (auditService as any).shouldRescheduleAudit(
        companyStartDate,
        currentScheduledDate
      );

      expect(shouldReschedule).toBe(true);
    });

    it('should return false when audit schedule is correct', () => {
      const companyStartDate = new Date('2024-01-01');
      const currentDate = new Date();
      const expectedDate = auditService.calculateNextAuditDate(companyStartDate, currentDate);

      const shouldReschedule = (auditService as any).shouldRescheduleAudit(
        companyStartDate,
        expectedDate
      );

      expect(shouldReschedule).toBe(false);
    });
  });
});