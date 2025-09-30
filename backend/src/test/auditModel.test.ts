import { AuditModel, CreateAuditData, UpdateAuditData } from '../models/Audit';
import { CompanyModel } from '../models/Company';
import { UserModel } from '../models/User';
import { AuditStatus } from '@prisma/client';
import prisma from '../lib/prisma';

describe('AuditModel', () => {
  let testUser: any;
  let testCompany: any;

  beforeAll(async () => {
    // Create test user
    testUser = await UserModel.create({
      username: 'audituser',
      email: 'audit@test.com',
      phoneNumber: '+1234567890',
      password: 'password123',
    });

    // Create test company
    testCompany = await CompanyModel.create({
      name: 'Test Audit Company',
      startDate: new Date('2024-01-01'),
      phoneNumber: '+1234567890',
      email: 'company@test.com',
      website: 'https://test.com',
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

  describe('create', () => {
    it('should create a new audit', async () => {
      const auditData: CreateAuditData = {
        companyId: testCompany.id,
        scheduledDate: new Date('2024-02-01'),
        assignedTo: testUser.id,
        notes: 'Initial audit',
      };

      const audit = await AuditModel.create(auditData);

      expect(audit).toBeDefined();
      expect(audit.companyId).toBe(testCompany.id);
      expect(audit.assignedTo).toBe(testUser.id);
      expect(audit.status).toBe(AuditStatus.SCHEDULED);
      expect(audit.notes).toBe('Initial audit');
      expect(audit.company).toBeDefined();
      expect(audit.assignee).toBeDefined();
    });

    it('should create audit with default status SCHEDULED', async () => {
      const auditData: CreateAuditData = {
        companyId: testCompany.id,
        scheduledDate: new Date('2024-02-01'),
        assignedTo: testUser.id,
      };

      const audit = await AuditModel.create(auditData);

      expect(audit.status).toBe(AuditStatus.SCHEDULED);
    });
  });

  describe('findById', () => {
    it('should find audit by ID', async () => {
      const auditData: CreateAuditData = {
        companyId: testCompany.id,
        scheduledDate: new Date('2024-02-01'),
        assignedTo: testUser.id,
      };

      const createdAudit = await AuditModel.create(auditData);
      const foundAudit = await AuditModel.findById(createdAudit.id);

      expect(foundAudit).toBeDefined();
      expect(foundAudit?.id).toBe(createdAudit.id);
      expect(foundAudit?.company).toBeDefined();
      expect(foundAudit?.assignee).toBeDefined();
    });

    it('should return null for non-existent audit', async () => {
      const foundAudit = await AuditModel.findById('non-existent-id');
      expect(foundAudit).toBeNull();
    });
  });

  describe('findMany', () => {
    beforeEach(async () => {
      // Create multiple audits for testing
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

    it('should find all audits without filters', async () => {
      const audits = await AuditModel.findMany();
      expect(audits).toHaveLength(2);
    });

    it('should filter audits by company ID', async () => {
      const audits = await AuditModel.findMany({ companyId: testCompany.id });
      expect(audits).toHaveLength(2);
      expect(audits.every(audit => audit.companyId === testCompany.id)).toBe(true);
    });

    it('should filter audits by assigned user', async () => {
      const audits = await AuditModel.findMany({ assignedTo: testUser.id });
      expect(audits).toHaveLength(2);
      expect(audits.every(audit => audit.assignedTo === testUser.id)).toBe(true);
    });

    it('should filter audits by status', async () => {
      const audits = await AuditModel.findMany({ status: AuditStatus.SCHEDULED });
      expect(audits).toHaveLength(2);
      expect(audits.every(audit => audit.status === AuditStatus.SCHEDULED)).toBe(true);
    });

    it('should filter audits by date range', async () => {
      const audits = await AuditModel.findMany({
        scheduledAfter: new Date('2024-01-15'),
        scheduledBefore: new Date('2024-02-15'),
      });
      expect(audits).toHaveLength(1);
    });
  });

  describe('update', () => {
    it('should update audit fields', async () => {
      const auditData: CreateAuditData = {
        companyId: testCompany.id,
        scheduledDate: new Date('2024-02-01'),
        assignedTo: testUser.id,
        notes: 'Original notes',
      };

      const createdAudit = await AuditModel.create(auditData);

      const updateData: UpdateAuditData = {
        notes: 'Updated notes',
        status: AuditStatus.COMPLETED,
        completedDate: new Date(),
      };

      const updatedAudit = await AuditModel.update(createdAudit.id, updateData);

      expect(updatedAudit).toBeDefined();
      expect(updatedAudit?.notes).toBe('Updated notes');
      expect(updatedAudit?.status).toBe(AuditStatus.COMPLETED);
      expect(updatedAudit?.completedDate).toBeDefined();
    });

    it('should return null for non-existent audit', async () => {
      const updateData: UpdateAuditData = {
        notes: 'Updated notes',
      };

      const updatedAudit = await AuditModel.update('non-existent-id', updateData);
      expect(updatedAudit).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete audit successfully', async () => {
      const auditData: CreateAuditData = {
        companyId: testCompany.id,
        scheduledDate: new Date('2024-02-01'),
        assignedTo: testUser.id,
      };

      const createdAudit = await AuditModel.create(auditData);
      const deleted = await AuditModel.delete(createdAudit.id);

      expect(deleted).toBe(true);

      const foundAudit = await AuditModel.findById(createdAudit.id);
      expect(foundAudit).toBeNull();
    });

    it('should return false for non-existent audit', async () => {
      const deleted = await AuditModel.delete('non-existent-id');
      expect(deleted).toBe(false);
    });
  });

  describe('findByCompanyId', () => {
    it('should find audits for specific company', async () => {
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

      const audits = await AuditModel.findByCompanyId(testCompany.id);

      expect(audits).toHaveLength(2);
      expect(audits.every(audit => audit.companyId === testCompany.id)).toBe(true);
      // Should be ordered by scheduledDate desc
      expect(audits[0].scheduledDate.getTime()).toBeGreaterThan(audits[1].scheduledDate.getTime());
    });
  });

  describe('findOverdue', () => {
    it('should find overdue audits', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);

      await AuditModel.create({
        companyId: testCompany.id,
        scheduledDate: pastDate,
        assignedTo: testUser.id,
      });

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);

      await AuditModel.create({
        companyId: testCompany.id,
        scheduledDate: futureDate,
        assignedTo: testUser.id,
      });

      const overdueAudits = await AuditModel.findOverdue();

      expect(overdueAudits).toHaveLength(1);
      expect(overdueAudits[0].scheduledDate.getTime()).toBeLessThan(new Date().getTime());
      expect(overdueAudits[0].status).toBe(AuditStatus.SCHEDULED);
    });
  });

  describe('markCompleted', () => {
    it('should mark audit as completed', async () => {
      const auditData: CreateAuditData = {
        companyId: testCompany.id,
        scheduledDate: new Date('2024-02-01'),
        assignedTo: testUser.id,
      };

      const createdAudit = await AuditModel.create(auditData);
      const completedAudit = await AuditModel.markCompleted(createdAudit.id, 'Audit completed successfully');

      expect(completedAudit).toBeDefined();
      expect(completedAudit?.status).toBe(AuditStatus.COMPLETED);
      expect(completedAudit?.completedDate).toBeDefined();
      expect(completedAudit?.notes).toBe('Audit completed successfully');
    });
  });

  describe('markOverdueAudits', () => {
    it('should mark overdue audits as overdue', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);

      await AuditModel.create({
        companyId: testCompany.id,
        scheduledDate: pastDate,
        assignedTo: testUser.id,
      });

      await AuditModel.create({
        companyId: testCompany.id,
        scheduledDate: pastDate,
        assignedTo: testUser.id,
      });

      const markedCount = await AuditModel.markOverdueAudits();

      expect(markedCount).toBe(2);

      const audits = await AuditModel.findMany({ status: AuditStatus.OVERDUE });
      expect(audits).toHaveLength(2);
    });
  });

  describe('findUpcoming', () => {
    it('should find upcoming audits within specified days', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 10);

      await AuditModel.create({
        companyId: testCompany.id,
        scheduledDate: tomorrow,
        assignedTo: testUser.id,
      });

      await AuditModel.create({
        companyId: testCompany.id,
        scheduledDate: nextWeek,
        assignedTo: testUser.id,
      });

      const upcomingAudits = await AuditModel.findUpcoming(7);

      expect(upcomingAudits).toHaveLength(1);
      expect(upcomingAudits[0].scheduledDate.getTime()).toBeLessThanOrEqual(
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).getTime()
      );
    });
  });
});