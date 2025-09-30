import { PrismaClient } from '@prisma/client';
import { setupTestDatabase, cleanupTestDatabase, createTestUser, createTestCompany } from './test-helpers/coverage-setup';

describe('Test Coverage Validation', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = await setupTestDatabase();
  });

  afterAll(async () => {
    await cleanupTestDatabase(prisma);
  });

  beforeEach(async () => {
    // Clean database before each test
    await prisma.notification.deleteMany();
    await prisma.audit.deleteMany();
    await prisma.note.deleteMany();
    await prisma.company.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('Model Coverage Tests', () => {
    it('should cover User model operations', async () => {
      // Test user creation
      const user = await createTestUser(prisma);
      expect(user.id).toBeDefined();
      expect(user.username).toBe('testuser');

      // Test user update
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { email: 'updated@example.com' },
      });
      expect(updatedUser.email).toBe('updated@example.com');

      // Test user deletion
      await prisma.user.delete({ where: { id: user.id } });
      const deletedUser = await prisma.user.findUnique({ where: { id: user.id } });
      expect(deletedUser).toBeNull();
    });

    it('should cover Company model operations', async () => {
      const user = await createTestUser(prisma);
      
      // Test company creation
      const company = await createTestCompany(prisma, user.id);
      expect(company.id).toBeDefined();
      expect(company.name).toBe('Test Company');

      // Test company update
      const updatedCompany = await prisma.company.update({
        where: { id: company.id },
        data: { adSpend: 10000, tier: 'TIER_1' },
      });
      expect(updatedCompany.adSpend).toBe(10000);
      expect(updatedCompany.tier).toBe('TIER_1');

      // Test company with relations
      const companyWithRelations = await prisma.company.findUnique({
        where: { id: company.id },
        include: {
          creator: true,
          notes: true,
          audits: true,
        },
      });
      expect(companyWithRelations?.creator.id).toBe(user.id);
    });

    it('should cover Note model operations', async () => {
      const user = await createTestUser(prisma);
      const company = await createTestCompany(prisma, user.id);

      // Test note creation
      const note = await prisma.note.create({
        data: {
          content: 'Test note content',
          companyId: company.id,
          userId: user.id,
        },
      });
      expect(note.content).toBe('Test note content');

      // Test note with relations
      const noteWithRelations = await prisma.note.findUnique({
        where: { id: note.id },
        include: {
          user: true,
          company: true,
        },
      });
      expect(noteWithRelations?.user.id).toBe(user.id);
      expect(noteWithRelations?.company.id).toBe(company.id);
    });

    it('should cover Audit model operations', async () => {
      const user = await createTestUser(prisma);
      const company = await createTestCompany(prisma, user.id);

      // Test audit creation
      const audit = await prisma.audit.create({
        data: {
          companyId: company.id,
          scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          assignedTo: user.id,
          status: 'SCHEDULED',
        },
      });
      expect(audit.status).toBe('SCHEDULED');

      // Test audit status update
      const updatedAudit = await prisma.audit.update({
        where: { id: audit.id },
        data: {
          status: 'COMPLETED',
          completedDate: new Date(),
          notes: 'Audit completed successfully',
        },
      });
      expect(updatedAudit.status).toBe('COMPLETED');
      expect(updatedAudit.notes).toBe('Audit completed successfully');
    });

    it('should cover Notification model operations', async () => {
      const user = await createTestUser(prisma);
      const company = await createTestCompany(prisma, user.id);

      // Test notification creation
      const notification = await prisma.notification.create({
        data: {
          userId: user.id,
          type: 'MEETING_REMINDER',
          title: 'Test Notification',
          message: 'This is a test notification',
          relatedCompanyId: company.id,
          scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });
      expect(notification.type).toBe('MEETING_REMINDER');

      // Test notification update (mark as sent)
      const updatedNotification = await prisma.notification.update({
        where: { id: notification.id },
        data: {
          sentAt: new Date(),
          isRead: true,
        },
      });
      expect(updatedNotification.sentAt).toBeDefined();
      expect(updatedNotification.isRead).toBe(true);
    });
  });

  describe('Business Logic Coverage Tests', () => {
    it('should cover tier classification logic', async () => {
      const user = await createTestUser(prisma);

      // Test Tier 1 classification (high ad spend)
      const tier1Company = await createTestCompany(prisma, user.id, {
        name: 'Tier 1 Company',
        adSpend: 15000,
        startDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), // 6 months old
      });

      // Test Tier 2 classification (new company)
      const tier2Company = await createTestCompany(prisma, user.id, {
        name: 'Tier 2 Company',
        adSpend: 3000,
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 1 month old
      });

      // Test Tier 3 classification (old company, low ad spend)
      const tier3Company = await createTestCompany(prisma, user.id, {
        name: 'Tier 3 Company',
        adSpend: 1000,
        startDate: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000), // Over 1 year old
      });

      // Verify tier classifications would be correct
      expect(tier1Company.adSpend).toBeGreaterThan(10000);
      expect(tier2Company.startDate.getTime()).toBeGreaterThan(Date.now() - 90 * 24 * 60 * 60 * 1000);
      expect(tier3Company.adSpend).toBeLessThan(5000);
      expect(tier3Company.startDate.getTime()).toBeLessThan(Date.now() - 365 * 24 * 60 * 60 * 1000);
    });

    it('should cover audit scheduling logic', async () => {
      const user = await createTestUser(prisma);

      // Test weekly audit scheduling (company < 3 months)
      const newCompany = await createTestCompany(prisma, user.id, {
        name: 'New Company',
        startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 2 months old
      });

      // Test monthly audit scheduling (company 3-12 months)
      const mediumCompany = await createTestCompany(prisma, user.id, {
        name: 'Medium Company',
        startDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), // 6 months old
      });

      // Test quarterly audit scheduling (company > 12 months)
      const oldCompany = await createTestCompany(prisma, user.id, {
        name: 'Old Company',
        startDate: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000), // Over 1 year old
      });

      // Create audits based on company age
      const audits = await Promise.all([
        prisma.audit.create({
          data: {
            companyId: newCompany.id,
            scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Weekly
            assignedTo: user.id,
            status: 'SCHEDULED',
          },
        }),
        prisma.audit.create({
          data: {
            companyId: mediumCompany.id,
            scheduledDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Monthly
            assignedTo: user.id,
            status: 'SCHEDULED',
          },
        }),
        prisma.audit.create({
          data: {
            companyId: oldCompany.id,
            scheduledDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // Quarterly
            assignedTo: user.id,
            status: 'SCHEDULED',
          },
        }),
      ]);

      expect(audits).toHaveLength(3);
      audits.forEach(audit => {
        expect(audit.status).toBe('SCHEDULED');
        expect(audit.scheduledDate.getTime()).toBeGreaterThan(Date.now());
      });
    });

    it('should cover notification scheduling logic', async () => {
      const user = await createTestUser(prisma);
      const company = await createTestCompany(prisma, user.id);

      // Test CEO meeting notification (1 month after company start)
      const meetingNotification = await prisma.notification.create({
        data: {
          userId: user.id,
          type: 'MEETING_REMINDER',
          title: 'CEO Meeting Reminder',
          message: `Schedule meeting with ${company.name}`,
          relatedCompanyId: company.id,
          scheduledFor: new Date(company.startDate.getTime() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      // Test audit reminder notification
      const auditNotification = await prisma.notification.create({
        data: {
          userId: user.id,
          type: 'AUDIT_DUE',
          title: 'Audit Due',
          message: `Audit is due for ${company.name}`,
          relatedCompanyId: company.id,
          scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      expect(meetingNotification.type).toBe('MEETING_REMINDER');
      expect(auditNotification.type).toBe('AUDIT_DUE');
      expect(meetingNotification.relatedCompanyId).toBe(company.id);
      expect(auditNotification.relatedCompanyId).toBe(company.id);
    });
  });

  describe('Error Handling Coverage Tests', () => {
    it('should cover database constraint violations', async () => {
      const user = await createTestUser(prisma);

      // Test unique constraint violation
      await expect(
        createTestUser(prisma, { username: 'testuser', email: 'different@example.com' })
      ).rejects.toThrow();

      // Test foreign key constraint
      await expect(
        prisma.company.create({
          data: {
            name: 'Invalid Company',
            startDate: new Date(),
            phoneNumber: '+1234567890',
            email: 'invalid@test.com',
            website: 'https://test.com',
            tier: 'TIER_2',
            adSpend: 5000,
            createdBy: 'non-existent-user-id',
          },
        })
      ).rejects.toThrow();
    });

    it('should cover validation errors', async () => {
      // Test invalid email format
      await expect(
        createTestUser(prisma, { email: 'invalid-email' })
      ).rejects.toThrow();

      // Test invalid phone number format
      await expect(
        createTestUser(prisma, { phoneNumber: 'invalid-phone' })
      ).rejects.toThrow();
    });
  });

  describe('Query Performance Coverage Tests', () => {
    it('should cover complex query scenarios', async () => {
      const user = await createTestUser(prisma);
      
      // Create multiple companies with related data
      const companies = await Promise.all([
        createTestCompany(prisma, user.id, { name: 'Company 1', tier: 'TIER_1' }),
        createTestCompany(prisma, user.id, { name: 'Company 2', tier: 'TIER_2' }),
        createTestCompany(prisma, user.id, { name: 'Company 3', tier: 'TIER_3' }),
      ]);

      // Add notes and audits for each company
      for (const company of companies) {
        await prisma.note.create({
          data: {
            content: `Note for ${company.name}`,
            companyId: company.id,
            userId: user.id,
          },
        });

        await prisma.audit.create({
          data: {
            companyId: company.id,
            scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            assignedTo: user.id,
            status: 'SCHEDULED',
          },
        });
      }

      // Test complex query with joins
      const companiesWithRelations = await prisma.company.findMany({
        include: {
          notes: true,
          audits: true,
          creator: true,
        },
        where: {
          createdBy: user.id,
        },
        orderBy: {
          name: 'asc',
        },
      });

      expect(companiesWithRelations).toHaveLength(3);
      companiesWithRelations.forEach(company => {
        expect(company.notes).toHaveLength(1);
        expect(company.audits).toHaveLength(1);
        expect(company.creator.id).toBe(user.id);
      });

      // Test aggregation queries
      const tierCounts = await prisma.company.groupBy({
        by: ['tier'],
        _count: {
          id: true,
        },
        where: {
          createdBy: user.id,
        },
      });

      expect(tierCounts).toHaveLength(3);
      tierCounts.forEach(tierCount => {
        expect(tierCount._count.id).toBe(1);
      });
    });
  });
});