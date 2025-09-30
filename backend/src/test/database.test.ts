import { testDatabaseConnection, initializeDatabase, disconnectDatabase } from '../utils/database';
import prisma from '../lib/prisma';

describe('Database Connection', () => {
  afterAll(async () => {
    await disconnectDatabase();
  });

  test('should connect to database successfully', async () => {
    const isConnected = await testDatabaseConnection();
    expect(isConnected).toBe(true);
  });

  test('should initialize database without errors', async () => {
    await expect(initializeDatabase()).resolves.not.toThrow();
  });

  test('should be able to query database', async () => {
    // This test will work once we have migrations applied
    await expect(prisma.$queryRaw`SELECT 1 as test`).resolves.toBeDefined();
  });
});