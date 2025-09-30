import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { CompanyTier } from '@prisma/client';

// Create mock functions with proper typing
const mockPrisma = {
    company: {
        findMany: jest.fn() as jest.MockedFunction<any>,
        findUnique: jest.fn() as jest.MockedFunction<any>,
        update: jest.fn() as jest.MockedFunction<any>,
        groupBy: jest.fn() as jest.MockedFunction<any>,
        count: jest.fn() as jest.MockedFunction<any>,
    },
    user: {
        findUnique: jest.fn() as jest.MockedFunction<any>,
    },
    tierChangeLog: {
        create: jest.fn() as jest.MockedFunction<any>,
        findMany: jest.fn() as jest.MockedFunction<any>,
        count: jest.fn() as jest.MockedFunction<any>,
    },
};

// Mock Prisma client before importing services
jest.mock('@prisma/client', () => ({
    PrismaClient: jest.fn().mockImplementation(() => mockPrisma),
    CompanyTier: {
        TIER_1: 'TIER_1',
        TIER_2: 'TIER_2',
        TIER_3: 'TIER_3',
    },
    TierChangeReason: {
        AUTOMATIC: 'AUTOMATIC',
        MANUAL_OVERRIDE: 'MANUAL_OVERRIDE',
    },
}));

// Define the enum locally for use in tests
const TierChangeReason = {
    AUTOMATIC: 'AUTOMATIC' as const,
    MANUAL_OVERRIDE: 'MANUAL_OVERRIDE' as const,
};

// Mock dependencies
jest.mock('../services/notificationService');
jest.mock('../models/Company');

// Import after mocking
import { TierService } from '../services/tierService';
import { CompanyModel } from '../models/Company';
import { NotificationService } from '../services/notificationService';

const mockNotificationService = NotificationService as jest.Mocked<typeof NotificationService>;
const mockCompanyModel = CompanyModel as jest.Mocked<typeof CompanyModel>;

describe('TierService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('updateAllTiers', () => {
        it('should update companies with tier changes', async () => {
            const mockCompanies = [
                {
                    id: 'company1',
                    name: 'Test Company 1',
                    startDate: new Date('2020-01-01'),
                    adSpend: 6000,
                    tier: CompanyTier.TIER_2,
                    createdBy: 'user1',
                },
                {
                    id: 'company2',
                    name: 'Test Company 2',
                    startDate: new Date('2024-01-01'),
                    adSpend: 1000,
                    tier: CompanyTier.TIER_1,
                    createdBy: 'user2',
                },
            ];

            mockPrisma.company.findMany.mockResolvedValue(mockCompanies);
            (mockCompanyModel.calculateTier as jest.Mock)
                .mockReturnValueOnce(CompanyTier.TIER_1) // company1 should be TIER_1
                .mockReturnValueOnce(CompanyTier.TIER_2); // company2 should be TIER_2

            mockPrisma.company.update.mockResolvedValue({} as any);
            mockPrisma.tierChangeLog.create.mockResolvedValue({} as any);
            (mockNotificationService.createNotification as jest.Mock).mockResolvedValue(undefined);

            const result = await TierService.updateAllTiers();

            expect(result.totalCompanies).toBe(2);
            expect(result.updatedCount).toBe(2);
            expect(result.changes).toHaveLength(2);
            expect(result.changes[0]).toEqual({
                companyId: 'company1',
                companyName: 'Test Company 1',
                oldTier: CompanyTier.TIER_2,
                newTier: CompanyTier.TIER_1,
            });

            // Verify database updates
            expect(mockPrisma.company.update).toHaveBeenCalledTimes(2);
            expect(mockPrisma.tierChangeLog.create).toHaveBeenCalledTimes(2);
            expect(mockNotificationService.createNotification as jest.Mock).toHaveBeenCalledTimes(2);
        });

        it('should not update companies with no tier changes', async () => {
            const mockCompanies = [
                {
                    id: 'company1',
                    name: 'Test Company 1',
                    startDate: new Date('2020-01-01'),
                    adSpend: 6000,
                    tier: CompanyTier.TIER_1,
                    createdBy: 'user1',
                },
            ];

            mockPrisma.company.findMany.mockResolvedValue(mockCompanies);
            (mockCompanyModel.calculateTier as jest.Mock).mockReturnValue(CompanyTier.TIER_1);

            const result = await TierService.updateAllTiers();

            expect(result.totalCompanies).toBe(1);
            expect(result.updatedCount).toBe(0);
            expect(result.changes).toHaveLength(0);

            // Verify no database updates
            expect(mockPrisma.company.update).not.toHaveBeenCalled();
            expect(mockPrisma.tierChangeLog.create).not.toHaveBeenCalled();
            expect(mockNotificationService.createNotification as jest.Mock).not.toHaveBeenCalled();
        });
    });

    describe('overrideTier', () => {
        it('should allow CEO to override tier', async () => {
            const mockAdmin = {
                id: 'admin1',
                username: 'admin',
                role: 'CEO',
            };

            const mockCompany = {
                id: 'company1',
                name: 'Test Company',
                tier: CompanyTier.TIER_2,
                createdBy: 'user1',
            };

            mockPrisma.user.findUnique.mockResolvedValue(mockAdmin as any);
            mockPrisma.company.findUnique.mockResolvedValue(mockCompany as any);
            mockPrisma.company.update.mockResolvedValue({} as any);
            mockPrisma.tierChangeLog.create.mockResolvedValue({} as any);
            (mockNotificationService.createNotification as jest.Mock).mockResolvedValue(undefined);

            await TierService.overrideTier('company1', CompanyTier.TIER_1, 'admin1', 'High performance');

            expect(mockPrisma.company.update).toHaveBeenCalledWith({
                where: { id: 'company1' },
                data: {
                    tier: CompanyTier.TIER_1,
                    updatedAt: expect.any(Date),
                },
            });

            expect(mockPrisma.tierChangeLog.create).toHaveBeenCalledWith({
                data: {
                    companyId: 'company1',
                    oldTier: CompanyTier.TIER_2,
                    newTier: CompanyTier.TIER_1,
                    reason: 'MANUAL_OVERRIDE',
                    changedBy: 'admin1',
                    notes: 'High performance',
                },
            });
        });

        it('should allow Manager to override tier', async () => {
            const mockManager = {
                id: 'manager1',
                username: 'manager',
                role: 'MANAGER',
            };

            const mockCompany = {
                id: 'company1',
                name: 'Test Company',
                tier: CompanyTier.TIER_2,
                createdBy: 'user1',
            };

            mockPrisma.user.findUnique.mockResolvedValue(mockManager as any);
            mockPrisma.company.findUnique.mockResolvedValue(mockCompany as any);
            mockPrisma.company.update.mockResolvedValue({} as any);
            mockPrisma.tierChangeLog.create.mockResolvedValue({} as any);
            (mockNotificationService.createNotification as jest.Mock).mockResolvedValue(undefined);

            await TierService.overrideTier('company1', CompanyTier.TIER_1, 'manager1');

            expect(mockPrisma.company.update).toHaveBeenCalled();
            expect(mockPrisma.tierChangeLog.create).toHaveBeenCalled();
        });

        it('should reject override from team member', async () => {
            const mockUser = {
                id: 'user1',
                username: 'user',
                role: 'TEAM_MEMBER',
            };

            mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);

            await expect(
                TierService.overrideTier('company1', CompanyTier.TIER_1, 'user1')
            ).rejects.toThrow('Insufficient permissions to override tier');
        });

        it('should reject override for non-existent company', async () => {
            const mockAdmin = {
                id: 'admin1',
                username: 'admin',
                role: 'CEO',
            };

            mockPrisma.user.findUnique.mockResolvedValue(mockAdmin as any);
            mockPrisma.company.findUnique.mockResolvedValue(null);

            await expect(
                TierService.overrideTier('nonexistent', CompanyTier.TIER_1, 'admin1')
            ).rejects.toThrow('Company not found');
        });

        it('should reject override to same tier', async () => {
            const mockAdmin = {
                id: 'admin1',
                username: 'admin',
                role: 'CEO',
            };

            const mockCompany = {
                id: 'company1',
                name: 'Test Company',
                tier: CompanyTier.TIER_1,
                createdBy: 'user1',
            };

            mockPrisma.user.findUnique.mockResolvedValue(mockAdmin as any);
            mockPrisma.company.findUnique.mockResolvedValue(mockCompany as any);

            await expect(
                TierService.overrideTier('company1', CompanyTier.TIER_1, 'admin1')
            ).rejects.toThrow('Company is already in the specified tier');
        });
    });

    describe('getTierHistory', () => {
        it('should return tier change history for a company', async () => {
            const mockHistory = [
                {
                    id: 'log1',
                    companyId: 'company1',
                    oldTier: CompanyTier.TIER_2,
                    newTier: CompanyTier.TIER_1,
                    reason: TierChangeReason.AUTOMATIC,
                    createdAt: new Date(),
                    changedByUser: null,
                },
                {
                    id: 'log2',
                    companyId: 'company1',
                    oldTier: CompanyTier.TIER_1,
                    newTier: CompanyTier.TIER_3,
                    reason: TierChangeReason.MANUAL_OVERRIDE,
                    createdAt: new Date(),
                    changedByUser: {
                        id: 'admin1',
                        username: 'admin',
                    },
                },
            ];

            mockPrisma.tierChangeLog.findMany.mockResolvedValue(mockHistory as any);

            const result = await TierService.getTierHistory('company1');

            expect(result).toEqual(mockHistory);
            expect(mockPrisma.tierChangeLog.findMany).toHaveBeenCalledWith({
                where: { companyId: 'company1' },
                include: {
                    changedByUser: {
                        select: {
                            id: true,
                            username: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            });
        });
    });

    describe('getTierStatistics', () => {
        it('should return tier distribution and statistics', async () => {
            const mockDistribution = [
                { tier: CompanyTier.TIER_1, _count: { tier: 5 } },
                { tier: CompanyTier.TIER_2, _count: { tier: 10 } },
                { tier: CompanyTier.TIER_3, _count: { tier: 3 } },
            ];

            mockPrisma.company.groupBy.mockResolvedValue(mockDistribution as any);
            mockPrisma.tierChangeLog.count.mockResolvedValue(7);
            mockPrisma.company.count.mockResolvedValue(18);

            const result = await TierService.getTierStatistics();

            expect(result).toEqual({
                distribution: {
                    TIER_1: 5,
                    TIER_2: 10,
                    TIER_3: 3,
                },
                recentChanges: 7,
                totalCompanies: 18,
            });
        });

        it('should handle missing tiers in distribution', async () => {
            const mockDistribution = [
                { tier: CompanyTier.TIER_1, _count: { tier: 5 } },
                // Missing TIER_2 and TIER_3
            ];

            mockPrisma.company.groupBy.mockResolvedValue(mockDistribution as any);
            mockPrisma.tierChangeLog.count.mockResolvedValue(2);
            mockPrisma.company.count.mockResolvedValue(5);

            const result = await TierService.getTierStatistics();

            expect(result.distribution).toEqual({
                TIER_1: 5,
                TIER_2: 0,
                TIER_3: 0,
            });
        });
    });

    describe('canOverrideTiers', () => {
        it('should return true for CEO', async () => {
            mockPrisma.user.findUnique.mockResolvedValue({
                role: 'CEO',
            } as any);

            const result = await TierService.canOverrideTiers('user1');
            expect(result).toBe(true);
        });

        it('should return true for Manager', async () => {
            mockPrisma.user.findUnique.mockResolvedValue({
                role: 'MANAGER',
            } as any);

            const result = await TierService.canOverrideTiers('user1');
            expect(result).toBe(true);
        });

        it('should return false for Team Member', async () => {
            mockPrisma.user.findUnique.mockResolvedValue({
                role: 'TEAM_MEMBER',
            } as any);

            const result = await TierService.canOverrideTiers('user1');
            expect(result).toBe(false);
        });

        it('should return false for non-existent user', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(null);

            const result = await TierService.canOverrideTiers('nonexistent');
            expect(result).toBe(false);
        });
    });

    describe('getCompaniesNeedingReview', () => {
        it('should return companies with tier mismatches', async () => {
            const mockCompanies = [
                {
                    id: 'company1',
                    name: 'Test Company 1',
                    tier: CompanyTier.TIER_2,
                    startDate: new Date('2020-01-01'),
                    adSpend: 6000,
                },
                {
                    id: 'company2',
                    name: 'Test Company 2',
                    tier: CompanyTier.TIER_1,
                    startDate: new Date('2024-01-01'),
                    adSpend: 1000,
                },
                {
                    id: 'company3',
                    name: 'Test Company 3',
                    tier: CompanyTier.TIER_1,
                    startDate: new Date('2020-01-01'),
                    adSpend: 6000,
                },
            ];

            mockPrisma.company.findMany.mockResolvedValue(mockCompanies as any);
            (mockCompanyModel.calculateTier as jest.Mock)
                .mockReturnValueOnce(CompanyTier.TIER_1) // company1 should be TIER_1
                .mockReturnValueOnce(CompanyTier.TIER_2) // company2 should be TIER_2
                .mockReturnValueOnce(CompanyTier.TIER_1); // company3 is correct

            const result = await TierService.getCompaniesNeedingReview();

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({
                id: 'company1',
                name: 'Test Company 1',
                tier: CompanyTier.TIER_2,
                suggestedTier: CompanyTier.TIER_1,
                reason: 'High ad spend qualifies for Tier 1',
            });
            expect(result[1]).toEqual({
                id: 'company2',
                name: 'Test Company 2',
                tier: CompanyTier.TIER_1,
                suggestedTier: CompanyTier.TIER_2,
                reason: 'Company is still new (< 6 months)',
            });
        });

        it('should return empty array when all tiers are correct', async () => {
            const mockCompanies = [
                {
                    id: 'company1',
                    name: 'Test Company 1',
                    tier: CompanyTier.TIER_1,
                    startDate: new Date('2020-01-01'),
                    adSpend: 6000,
                },
            ];

            mockPrisma.company.findMany.mockResolvedValue(mockCompanies as any);
            (mockCompanyModel.calculateTier as jest.Mock).mockReturnValue(CompanyTier.TIER_1);

            const result = await TierService.getCompaniesNeedingReview();

            expect(result).toHaveLength(0);
        });
    });
});