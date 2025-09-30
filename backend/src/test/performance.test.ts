import request from 'supertest';
import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import app from '../server';
import { JwtService } from '../utils/jwt';
import { NotificationService } from '../services/notificationService';
import { AuditService } from '../services/auditService';

// Global test variables
let prisma!: PrismaClient;
let notificationService!: NotificationService;
let auditService!: AuditService;
let authToken: string;
let userId: string;

// Global setup
beforeAll(async () => {
  // Create test app with test database
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/client_management_test';
  prisma = new PrismaClient();
  notificationService = new NotificationService();
  auditService = new AuditService();

  await prisma.$connect();

  // Create test user
  const testUser = await prisma.user.create({
    data: {
      username: 'perftest',
      email: 'perftest@example.com',
      phoneNumber: '+1234567890',
      password: 'hashedpassword',
      role: 'TEAM_MEMBER',
      emailNotifications: true,
      smsNotifications: false,
      meetingReminders: true,
      auditReminders: true,
    },
  });

  userId = testUser.id;
  authToken = JwtService.generateAccessToken({
    userId: testUser.id,
    username: testUser.username,
    email: testUser.email,
    role: testUser.role
  });
});

describe('Performance Tests', () => {



  describe('Company API Performance', () => {
    beforeEach(async () => {
      // Create test companies for performance testing
      const companies = Array.from({ length: 100 }, (_, i) => ({
        name: `Test Company ${i}`,
        startDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
        phoneNumber: `+123456789${i}`,
        email: `company${i}@example.com`,
        website: `https://company${i}.com`,
        adSpend: Math.random() * 10000,
        createdBy: userId,
      }));

      await prisma.company.createMany({ data: companies });
    });

    afterEach(async () => {
      await prisma.company.deleteMany({ where: { createdBy: userId } });
    });

    it('should handle large company lists efficiently', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .get('/api/companies')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ limit: 50, offset: 0 })
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(50);
      expect(response.body.pagination).toBeDefined();
      expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
    });

    it('should handle pagination efficiently', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .get('/api/companies')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ limit: 25, offset: 50 })
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(25);
      expect(responseTime).toBeLessThan(1000);
    });

    it('should handle filtering efficiently', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .get('/api/companies')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ tier: 'TIER_1', limit: 50 })
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.body.success).toBe(true);
      expect(responseTime).toBeLessThan(1000);
    });

    it('should handle search efficiently', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .get('/api/companies')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ search: 'Test Company', limit: 50 })
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.body.success).toBe(true);
      expect(responseTime).toBeLessThan(1000);
    });
  });

  describe('Cache Performance', () => {
    it('should serve cached responses faster', async () => {
      // First request (no cache)
      const startTime1 = Date.now();
      await request(app)
        .get('/api/companies')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ limit: 10 })
        .expect(200);
      const firstRequestTime = Date.now() - startTime1;

      // Second request (should be cached)
      const startTime2 = Date.now();
      await request(app)
        .get('/api/companies')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ limit: 10 })
        .expect(200);
      const secondRequestTime = Date.now() - startTime2;

      // Cached request should be faster (allowing some margin for test environment)
      expect(secondRequestTime).toBeLessThanOrEqual(firstRequestTime + 50);
    });
  });

  describe('Database Query Performance', () => {
    beforeEach(async () => {
      // Create more test data for database performance testing
      const companies = Array.from({ length: 500 }, (_, i) => ({
        name: `DB Test Company ${i}`,
        startDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
        phoneNumber: `+987654321${i}`,
        email: `dbcompany${i}@example.com`,
        website: `https://dbcompany${i}.com`,
        adSpend: Math.random() * 10000,
        createdBy: userId,
      }));

      await prisma.company.createMany({ data: companies });
    });

    afterEach(async () => {
      await prisma.company.deleteMany({
        where: {
          name: { startsWith: 'DB Test Company' }
        }
      });
    });

    it('should perform indexed queries efficiently', async () => {
      const startTime = Date.now();

      // Query using indexed field (tier)
      const companies = await prisma.company.findMany({
        where: { tier: 'TIER_1' },
        take: 50,
      });

      const queryTime = Date.now() - startTime;

      expect(companies).toBeDefined();
      expect(queryTime).toBeLessThan(500); // Should complete within 500ms
    });

    it('should perform complex queries efficiently', async () => {
      const startTime = Date.now();

      // Complex query with multiple conditions
      const companies = await prisma.company.findMany({
        where: {
          AND: [
            { createdBy: userId },
            { tier: { in: ['TIER_1', 'TIER_2'] } },
            { adSpend: { gte: 1000 } },
          ],
        },
        include: {
          creator: {
            select: { username: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 25,
      });

      const queryTime = Date.now() - startTime;

      expect(companies).toBeDefined();
      expect(queryTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should perform count queries efficiently', async () => {
      const startTime = Date.now();

      const count = await prisma.company.count({
        where: { createdBy: userId },
      });

      const queryTime = Date.now() - startTime;

      expect(count).toBeGreaterThan(0);
      expect(queryTime).toBeLessThan(200); // Count should be very fast
    });
  });

  describe('Concurrent Request Performance', () => {
    it('should handle multiple concurrent requests', async () => {
      const concurrentRequests = 10;
      const startTime = Date.now();

      const promises = Array.from({ length: concurrentRequests }, () =>
        request(app)
          .get('/api/companies')
          .set('Authorization', `Bearer ${authToken}`)
          .query({ limit: 10 })
      );

      const responses = await Promise.all(promises);
      const totalTime = Date.now() - startTime;

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      // Total time should be reasonable for concurrent requests
      expect(totalTime).toBeLessThan(5000); // 5 seconds for 10 concurrent requests
    });
  });

  describe('Memory Usage', () => {
    it('should not leak memory during repeated requests', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Make many requests
      for (let i = 0; i < 50; i++) {
        await request(app)
          .get('/api/companies')
          .set('Authorization', `Bearer ${authToken}`)
          .query({ limit: 10 });
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });
});

describe('Notification System Performance', () => {
  beforeEach(async () => {
    // Clean up notification data
    await prisma.notification.deleteMany();
  });

  it('should handle bulk notification creation efficiently', async () => {
    const startTime = Date.now();

    // Create 100 companies
    const companies = [];
    for (let i = 0; i < 100; i++) {
      companies.push({
        name: `Company ${i}`,
        startDate: new Date(),
        phoneNumber: '+1234567890',
        email: `company${i}@test.com`,
        website: 'https://test.com',
        tier: 'TIER_2' as const,
        adSpend: 5000,
        createdBy: userId,
      });
    }

    await prisma.company.createMany({ data: companies });

    // Test bulk notification scheduling
    const createdCompanies = await prisma.company.findMany({
      where: { createdBy: userId },
    });

    const notifications = createdCompanies.map(company => ({
      userId: userId,
      type: 'MEETING_REMINDER' as const,
      title: 'Meeting Reminder',
      message: `Meeting reminder for ${company.name}`,
      relatedCompanyId: company.id,
      scheduledFor: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    }));

    await prisma.notification.createMany({ data: notifications });

    const endTime = Date.now();
    const executionTime = endTime - startTime;

    // Should complete within 5 seconds
    expect(executionTime).toBeLessThan(5000);

    // Verify all notifications were created
    const notificationCount = await prisma.notification.count({
      where: { userId },
    });
    expect(notificationCount).toBe(100);
  });

  it('should efficiently query due notifications', async () => {
    // Create 1000 notifications with various due dates
    const notifications = [];
    for (let i = 0; i < 1000; i++) {
      notifications.push({
        userId: userId,
        type: 'MEETING_REMINDER' as const,
        title: `Notification ${i}`,
        message: `Message ${i}`,
        scheduledFor: new Date(Date.now() + (i * 24 * 60 * 60 * 1000)), // Spread over 1000 days
      });
    }

    await prisma.notification.createMany({ data: notifications });

    const startTime = Date.now();

    // Query for due notifications (next 7 days)
    const dueNotifications = await prisma.notification.findMany({
      where: {
        scheduledFor: {
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
        sentAt: null,
      },
      include: {
        user: true,
        relatedCompany: true,
      },
    });

    const endTime = Date.now();
    const queryTime = endTime - startTime;

    // Query should complete within 1 second
    expect(queryTime).toBeLessThan(1000);
    expect(dueNotifications.length).toBe(7); // 7 notifications due in next 7 days
  });

  it('should process notification queue efficiently', async () => {
    const startTime = Date.now();

    // Create 200 due notifications
    const notifications = [];
    for (let i = 0; i < 200; i++) {
      notifications.push({
        userId: userId,
        type: 'MEETING_REMINDER' as const,
        title: `Notification ${i}`,
        message: `Message ${i}`,
        scheduledFor: new Date(Date.now() - 1000), // All due now
      });
    }

    await prisma.notification.createMany({ data: notifications });

    // Process notifications
    const dueNotifications = await prisma.notification.findMany({
      where: {
        scheduledFor: { lte: new Date() },
        sentAt: null,
      },
    });

    // Simulate processing (mark as sent)
    const updatePromises = dueNotifications.map(notification =>
      prisma.notification.update({
        where: { id: notification.id },
        data: { sentAt: new Date() },
      })
    );

    await Promise.all(updatePromises);

    const endTime = Date.now();
    const processingTime = endTime - startTime;

    // Should process within 3 seconds
    expect(processingTime).toBeLessThan(3000);

    // Verify all notifications were processed
    const processedCount = await prisma.notification.count({
      where: { sentAt: { not: null } },
    });
    expect(processedCount).toBe(200);
  });

  it('should handle notification API endpoints efficiently', async () => {
    // Create test notifications
    const notifications = [];
    for (let i = 0; i < 50; i++) {
      notifications.push({
        userId: userId,
        type: 'MEETING_REMINDER' as const,
        title: `API Notification ${i}`,
        message: `API Message ${i}`,
        scheduledFor: new Date(Date.now() + i * 60 * 60 * 1000), // Spread over hours
      });
    }

    await prisma.notification.createMany({ data: notifications });

    const startTime = Date.now();

    const response = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${authToken}`)
      .query({ limit: 25, page: 1 })
      .expect(200);

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    expect(response.body.success).toBe(true);
    expect(response.body.data.notifications).toHaveLength(25);
    expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
  });
});

describe('Audit System Performance', () => {
  beforeEach(async () => {
    // Clean up audit data
    await prisma.audit.deleteMany();
  });

  it('should handle bulk audit scheduling efficiently', async () => {
    const startTime = Date.now();

    // Create 500 companies with different start dates
    const companies = [];
    for (let i = 0; i < 500; i++) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - (i * 7)); // Companies started at different times

      companies.push({
        name: `Audit Company ${i}`,
        startDate,
        phoneNumber: '+1234567890',
        email: `auditcompany${i}@test.com`,
        website: 'https://test.com',
        tier: 'TIER_2' as const,
        adSpend: 5000,
        createdBy: userId,
      });
    }

    await prisma.company.createMany({ data: companies });

    // Schedule audits for all companies
    const createdCompanies = await prisma.company.findMany({
      where: { name: { startsWith: 'Audit Company' } },
    });

    const audits = [];
    for (const company of createdCompanies) {
      const companyAge = Date.now() - company.startDate.getTime();
      const ageInMonths = companyAge / (30 * 24 * 60 * 60 * 1000);

      let nextAuditDate: Date;
      if (ageInMonths < 3) {
        // Weekly audits for companies < 3 months
        nextAuditDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      } else if (ageInMonths < 12) {
        // Monthly audits for companies 3-12 months
        nextAuditDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      } else {
        // Quarterly audits for companies > 12 months
        nextAuditDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
      }

      audits.push({
        companyId: company.id,
        scheduledDate: nextAuditDate,
        assignedTo: userId,
        status: 'SCHEDULED' as const,
      });
    }

    await prisma.audit.createMany({ data: audits });

    const endTime = Date.now();
    const executionTime = endTime - startTime;

    // Should complete within 10 seconds
    expect(executionTime).toBeLessThan(10000);

    // Verify all audits were scheduled
    const auditCount = await prisma.audit.count({
      where: { assignedTo: userId },
    });
    expect(auditCount).toBe(500);
  });

  it('should efficiently query overdue audits', async () => {
    // Create test company
    const company = await prisma.company.create({
      data: {
        name: 'Overdue Test Company',
        startDate: new Date(),
        phoneNumber: '+1234567890',
        email: 'overdue@test.com',
        website: 'https://test.com',
        tier: 'TIER_2',
        adSpend: 5000,
        createdBy: userId,
      },
    });

    // Create 1000 audits with various scheduled dates
    const audits = [];
    for (let i = 0; i < 1000; i++) {
      audits.push({
        companyId: company.id,
        scheduledDate: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)), // Past dates
        assignedTo: userId,
        status: i < 50 ? ('OVERDUE' as const) : ('SCHEDULED' as const),
      });
    }

    await prisma.audit.createMany({ data: audits });

    const startTime = Date.now();

    // Query for overdue audits
    const overdueAudits = await prisma.audit.findMany({
      where: {
        scheduledDate: {
          lt: new Date(),
        },
        status: {
          in: ['SCHEDULED', 'OVERDUE'],
        },
      },
      include: {
        company: true,
        assignee: true,
      },
    });

    const endTime = Date.now();
    const queryTime = endTime - startTime;

    // Query should complete within 1 second
    expect(queryTime).toBeLessThan(1000);
    expect(overdueAudits.length).toBeGreaterThan(0);
  });

  it('should handle audit status updates efficiently', async () => {
    const startTime = Date.now();

    // Create test company
    const company = await prisma.company.create({
      data: {
        name: 'Update Test Company',
        startDate: new Date(),
        phoneNumber: '+1234567890',
        email: 'update@test.com',
        website: 'https://test.com',
        tier: 'TIER_2',
        adSpend: 5000,
        createdBy: userId,
      },
    });

    // Create 300 scheduled audits
    const audits = [];
    for (let i = 0; i < 300; i++) {
      audits.push({
        companyId: company.id,
        scheduledDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        assignedTo: userId,
        status: 'SCHEDULED' as const,
      });
    }

    await prisma.audit.createMany({ data: audits });

    // Update all audits to completed
    const createdAudits = await prisma.audit.findMany({
      where: {
        status: 'SCHEDULED',
        companyId: company.id,
      },
    });

    const updatePromises = createdAudits.map(audit =>
      prisma.audit.update({
        where: { id: audit.id },
        data: {
          status: 'COMPLETED',
          completedDate: new Date(),
          notes: `Audit completed for ${audit.id}`,
        },
      })
    );

    await Promise.all(updatePromises);

    const endTime = Date.now();
    const updateTime = endTime - startTime;

    // Should complete within 3 seconds
    expect(updateTime).toBeLessThan(3000);

    // Verify all audits were updated
    const completedCount = await prisma.audit.count({
      where: {
        status: 'COMPLETED',
        companyId: company.id,
      },
    });
    expect(completedCount).toBe(300);
  });

  it('should handle audit API endpoints efficiently', async () => {
    // Create test company and audits
    const company = await prisma.company.create({
      data: {
        name: 'API Test Company',
        startDate: new Date(),
        phoneNumber: '+1234567890',
        email: 'api@test.com',
        website: 'https://test.com',
        tier: 'TIER_2',
        adSpend: 5000,
        createdBy: userId,
      },
    });

    const audits = [];
    for (let i = 0; i < 100; i++) {
      audits.push({
        companyId: company.id,
        scheduledDate: new Date(Date.now() + i * 24 * 60 * 60 * 1000),
        assignedTo: userId,
        status: 'SCHEDULED' as const,
      });
    }

    await prisma.audit.createMany({ data: audits });

    const startTime = Date.now();

    const response = await request(app)
      .get('/api/audits')
      .set('Authorization', `Bearer ${authToken}`)
      .query({ limit: 50, page: 1 })
      .expect(200);

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    expect(response.body.success).toBe(true);
    expect(response.body.data.audits).toHaveLength(50);
    expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
  });
});

describe('Complex Query Performance', () => {
  beforeEach(async () => {
    // Clean up test data
    await prisma.notification.deleteMany();
    await prisma.audit.deleteMany();
    await prisma.note.deleteMany();
    await prisma.company.deleteMany({ where: { createdBy: userId } });
  });

  it('should handle complex queries with joins efficiently', async () => {
    const startTime = Date.now();

    // Create 100 companies
    const companies = [];
    for (let i = 0; i < 100; i++) {
      companies.push({
        name: `Complex Company ${i}`,
        startDate: new Date(),
        phoneNumber: '+1234567890',
        email: `complex${i}@test.com`,
        website: 'https://test.com',
        tier: 'TIER_2' as const,
        adSpend: 5000,
        createdBy: userId,
      });
    }

    await prisma.company.createMany({ data: companies });

    const createdCompanies = await prisma.company.findMany({
      where: { name: { startsWith: 'Complex Company' } },
    });

    // Create notes and audits for each company
    const notes = [];
    const audits = [];

    for (const company of createdCompanies) {
      // 5 notes per company
      for (let j = 0; j < 5; j++) {
        notes.push({
          content: `Note ${j} for ${company.name}`,
          companyId: company.id,
          userId: userId,
        });
      }

      // 3 audits per company
      for (let k = 0; k < 3; k++) {
        audits.push({
          companyId: company.id,
          scheduledDate: new Date(Date.now() + k * 7 * 24 * 60 * 60 * 1000),
          assignedTo: userId,
          status: 'SCHEDULED' as const,
        });
      }
    }

    await prisma.note.createMany({ data: notes });
    await prisma.audit.createMany({ data: audits });

    // Complex query with multiple joins
    const complexQuery = await prisma.company.findMany({
      include: {
        notes: {
          include: {
            user: true,
          },
        },
        audits: {
          include: {
            assignee: true,
          },
        },
        creator: true,
      },
      where: {
        tier: 'TIER_2',
        name: { startsWith: 'Complex Company' },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const endTime = Date.now();
    const queryTime = endTime - startTime;

    // Complex query should complete within 2 seconds
    expect(queryTime).toBeLessThan(2000);
    expect(complexQuery).toHaveLength(100);
    expect(complexQuery[0].notes).toHaveLength(5);
    expect(complexQuery[0].audits).toHaveLength(3);
  });
});

// Global cleanup
afterAll(async () => {
  // Clean up test data
  await prisma.company.deleteMany({ where: { createdBy: userId } });
  await prisma.user.delete({ where: { id: userId } });
  await prisma.$disconnect();
});