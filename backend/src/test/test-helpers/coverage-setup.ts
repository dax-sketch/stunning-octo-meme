import { PrismaClient } from '@prisma/client';

// Test database setup for coverage reporting
export const setupTestDatabase = async (): Promise<PrismaClient> => {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/client_management_test',
      },
    },
  });

  await prisma.$connect();
  return prisma;
};

export const cleanupTestDatabase = async (prisma: PrismaClient): Promise<void> => {
  // Clean up in reverse order of dependencies
  await prisma.notification.deleteMany();
  await prisma.audit.deleteMany();
  await prisma.note.deleteMany();
  await prisma.company.deleteMany();
  await prisma.user.deleteMany();
  
  await prisma.$disconnect();
};

export const createTestUser = async (prisma: PrismaClient, overrides: any = {}) => {
  return await prisma.user.create({
    data: {
      username: 'testuser',
      email: 'test@example.com',
      phoneNumber: '+1234567890',
      password: '$2a$10$hashedpassword',
      role: 'TEAM_MEMBER',
      notificationPreferences: {
        email: true,
        sms: false,
        meetingReminders: true,
        auditReminders: true,
      },
      ...overrides,
    },
  });
};

export const createTestCompany = async (prisma: PrismaClient, userId: string, overrides: any = {}) => {
  return await prisma.company.create({
    data: {
      name: 'Test Company',
      startDate: new Date('2024-01-01'),
      phoneNumber: '+1234567890',
      email: 'company@test.com',
      website: 'https://test.com',
      tier: 'TIER_2',
      adSpend: 5000,
      createdBy: userId,
      ...overrides,
    },
  });
};