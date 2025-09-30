import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { Request, Response } from 'express';
import { CompanyTier } from '@prisma/client';
import { TierController } from '../controllers/tierController';
import { TierService } from '../services/tierService';

// Mock TierService
jest.mock('../services/tierService');

const mockTierService = TierService as jest.Mocked<typeof TierService>;

describe('TierController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    
    mockRequest = {
      user: { id: 'user1' },
      params: {},
      body: {},
    };
    
    mockResponse = {
      json: mockJson,
      status: mockStatus,
    };

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('updateAllTiers', () => {
    it('should successfully update all tiers', async () => {
      const mockResult = {
        totalCompanies: 10,
        updatedCount: 3,
        changes: [
          {
            companyId: 'company1',
            companyName: 'Test Company 1',
            oldTier: CompanyTier.TIER_2,
            newTier: CompanyTier.TIER_1,
          },
        ],
      };

      mockTierService.updateAllTiers.mockResolvedValue(mockResult);

      await TierController.updateAllTiers(mockRequest as Request, mockResponse as Response);

      expect(mockTierService.updateAllTiers).toHaveBeenCalled();
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: {
          message: 'Updated 3 out of 10 companies',
          ...mockResult,
        },
      });
    });

    it('should handle errors during tier update', async () => {
      mockTierService.updateAllTiers.mockRejectedValue(new Error('Database error'));

      await TierController.updateAllTiers(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'TIER_UPDATE_FAILED',
          message: 'Failed to update company tiers',
          details: 'Database error',
        },
      });
    });
  });

  describe('overrideTier', () => {
    beforeEach(() => {
      mockRequest.params = { companyId: 'company1' };
      mockRequest.body = { tier: 'TIER_1', reason: 'High performance' };
    });

    it('should successfully override tier', async () => {
      mockTierService.overrideTier.mockResolvedValue();

      await TierController.overrideTier(mockRequest as Request, mockResponse as Response);

      expect(mockTierService.overrideTier).toHaveBeenCalledWith(
        'company1',
        'TIER_1',
        'user1',
        'High performance'
      );
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: {
          message: 'Successfully updated company tier to TIER_1',
        },
      });
    });

    it('should return 401 for unauthenticated user', async () => {
      mockRequest.user = undefined;

      await TierController.overrideTier(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        },
      });
    });

    it('should return 400 for invalid tier', async () => {
      mockRequest.body.tier = 'INVALID_TIER';

      await TierController.overrideTier(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_TIER',
          message: 'Invalid tier value. Must be TIER_1, TIER_2, or TIER_3',
        },
      });
    });

    it('should return 403 for insufficient permissions', async () => {
      mockTierService.overrideTier.mockRejectedValue(new Error('Insufficient permissions to override tier'));

      await TierController.overrideTier(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(403);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Only CEOs and Managers can override company tiers',
        },
      });
    });

    it('should return 404 for company not found', async () => {
      mockTierService.overrideTier.mockRejectedValue(new Error('Company not found'));

      await TierController.overrideTier(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'COMPANY_NOT_FOUND',
          message: 'Company not found',
        },
      });
    });

    it('should return 400 for same tier override', async () => {
      mockTierService.overrideTier.mockRejectedValue(new Error('Company is already in the specified tier'));

      await TierController.overrideTier(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'TIER_UNCHANGED',
          message: 'Company is already in the specified tier',
        },
      });
    });
  });

  describe('getTierHistory', () => {
    beforeEach(() => {
      mockRequest.params = { companyId: 'company1' };
    });

    it('should return tier history', async () => {
      const mockHistory = [
        {
          id: 'log1',
          companyId: 'company1',
          oldTier: CompanyTier.TIER_2,
          newTier: CompanyTier.TIER_1,
          reason: 'AUTOMATIC',
          createdAt: '2024-01-01T00:00:00Z',
        },
      ];

      mockTierService.getTierHistory.mockResolvedValue(mockHistory as any);

      await TierController.getTierHistory(mockRequest as Request, mockResponse as Response);

      expect(mockTierService.getTierHistory).toHaveBeenCalledWith('company1');
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockHistory,
      });
    });

    it('should handle errors', async () => {
      mockTierService.getTierHistory.mockRejectedValue(new Error('Database error'));

      await TierController.getTierHistory(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'TIER_HISTORY_FAILED',
          message: 'Failed to retrieve tier history',
          details: 'Database error',
        },
      });
    });
  });

  describe('getTierStatistics', () => {
    it('should return tier statistics', async () => {
      const mockStats = {
        distribution: {
          TIER_1: 5,
          TIER_2: 10,
          TIER_3: 3,
        },
        recentChanges: 7,
        totalCompanies: 18,
      };

      mockTierService.getTierStatistics.mockResolvedValue(mockStats);

      await TierController.getTierStatistics(mockRequest as Request, mockResponse as Response);

      expect(mockTierService.getTierStatistics).toHaveBeenCalled();
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockStats,
      });
    });

    it('should handle errors', async () => {
      mockTierService.getTierStatistics.mockRejectedValue(new Error('Database error'));

      await TierController.getTierStatistics(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'TIER_STATISTICS_FAILED',
          message: 'Failed to retrieve tier statistics',
          details: 'Database error',
        },
      });
    });
  });

  describe('getCompaniesNeedingReview', () => {
    it('should return companies needing review', async () => {
      const mockCompanies = [
        {
          id: 'company1',
          name: 'Test Company',
          tier: CompanyTier.TIER_2,
          suggestedTier: CompanyTier.TIER_1,
          reason: 'High ad spend qualifies for Tier 1',
        },
      ];

      mockTierService.getCompaniesNeedingReview.mockResolvedValue(mockCompanies as any);

      await TierController.getCompaniesNeedingReview(mockRequest as Request, mockResponse as Response);

      expect(mockTierService.getCompaniesNeedingReview).toHaveBeenCalled();
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockCompanies,
      });
    });

    it('should handle errors', async () => {
      mockTierService.getCompaniesNeedingReview.mockRejectedValue(new Error('Database error'));

      await TierController.getCompaniesNeedingReview(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'TIER_REVIEW_FAILED',
          message: 'Failed to retrieve companies needing review',
          details: 'Database error',
        },
      });
    });
  });

  describe('canOverrideTiers', () => {
    it('should return override permissions', async () => {
      mockTierService.canOverrideTiers.mockResolvedValue(true);

      await TierController.canOverrideTiers(mockRequest as Request, mockResponse as Response);

      expect(mockTierService.canOverrideTiers).toHaveBeenCalledWith('user1');
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: {
          canOverride: true,
        },
      });
    });

    it('should return 401 for unauthenticated user', async () => {
      mockRequest.user = undefined;

      await TierController.canOverrideTiers(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        },
      });
    });

    it('should handle errors', async () => {
      mockTierService.canOverrideTiers.mockRejectedValue(new Error('Database error'));

      await TierController.canOverrideTiers(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'PERMISSION_CHECK_FAILED',
          message: 'Failed to check tier override permissions',
          details: 'Database error',
        },
      });
    });
  });
});