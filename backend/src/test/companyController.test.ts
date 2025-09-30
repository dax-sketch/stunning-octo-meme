import { Request, Response } from 'express';
import { CompanyController } from '../controllers/companyController';
import { CompanyModel } from '../models/Company';
import { CompanyTier } from '@prisma/client';
import { it } from 'node:test';
import { it } from 'node:test';
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
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';

// Mock the CompanyModel
jest.mock('../models/Company');

const mockCompanyModel = CompanyModel as jest.Mocked<typeof CompanyModel>;

// Helper to create mock request and response
const createMockReq = (body: any = {}, params: any = {}, query: any = {}, user?: any): any => ({
  body,
  params,
  query,
  user
});

const createMockRes = (): any => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('CompanyController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create company successfully', async () => {
      const req = createMockReq(
        {
          name: 'Test Company',
          startDate: '2023-01-01',
          phoneNumber: '+1234567890',
          email: 'test@company.com'
        },
        {},
        {},
        { userId: 'user123', username: 'testuser', role: 'TEAM_MEMBER' }
      );
      const res = createMockRes();

      const createdCompany = {
        id: 'company123',
        name: 'Test Company',
        createdBy: 'user123'
      };

      mockCompanyModel.create.mockResolvedValue(createdCompany as any);

      await CompanyController.create(req, res);

      expect(mockCompanyModel.create).toHaveBeenCalledWith({
        name: 'Test Company',
        startDate: '2023-01-01',
        phoneNumber: '+1234567890',
        email: 'test@company.com',
        createdBy: 'user123'
      });

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: createdCompany,
        message: 'Company created successfully'
      });
    });

    it('should return 401 if user not authenticated', async () => {
      const req = createMockReq({ name: 'Test Company' });
      const res = createMockRes();

      await CompanyController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
    });

    it('should return 400 for validation error', async () => {
      const req = createMockReq(
        { name: 'Test Company' }, // Missing required fields
        {},
        {},
        { userId: 'user123' }
      );
      const res = createMockRes();

      mockCompanyModel.create.mockRejectedValue(new Error('Validation error: email is required'));

      await CompanyController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation error: email is required'
        }
      });
    });

    it('should return 409 for duplicate company', async () => {
      const req = createMockReq(
        {
          name: 'Test Company',
          startDate: '2023-01-01',
          phoneNumber: '+1234567890',
          email: 'test@company.com'
        },
        {},
        {},
        { userId: 'user123' }
      );
      const res = createMockRes();

      mockCompanyModel.create.mockRejectedValue(new Error('Company with this name already exists'));

      await CompanyController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'DUPLICATE_COMPANY',
          message: 'Company with this name already exists'
        }
      });
    });
  });

  describe('getById', () => {
    it('should return company by ID', async () => {
      const req = createMockReq({}, { id: 'company123' });
      const res = createMockRes();

      const company = {
        id: 'company123',
        name: 'Test Company'
      };

      mockCompanyModel.findById.mockResolvedValue(company as any);

      await CompanyController.getById(req, res);

      expect(mockCompanyModel.findById).toHaveBeenCalledWith('company123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: company
      });
    });

    it('should return 404 for non-existent company', async () => {
      const req = createMockReq({}, { id: 'nonexistent' });
      const res = createMockRes();

      mockCompanyModel.findById.mockResolvedValue(null);

      await CompanyController.getById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'COMPANY_NOT_FOUND',
          message: 'Company not found'
        }
      });
    });

    it('should return 400 for missing ID parameter', async () => {
      const req = createMockReq({}, {});
      const res = createMockRes();

      await CompanyController.getById(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'MISSING_PARAMETER',
          message: 'Company ID is required'
        }
      });
    });
  });

  describe('getMany', () => {
    it('should return companies with default pagination', async () => {
      const req = createMockReq({}, {}, {});
      const res = createMockRes();

      const companies = [
        { id: 'company1', name: 'Company 1' },
        { id: 'company2', name: 'Company 2' }
      ];

      mockCompanyModel.findMany.mockResolvedValue(companies as any);
      mockCompanyModel.count.mockResolvedValue(2);

      await CompanyController.getMany(req, res);

      expect(mockCompanyModel.findMany).toHaveBeenCalledWith({}, 50, 0);
      expect(mockCompanyModel.count).toHaveBeenCalledWith({});

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: companies,
        pagination: {
          total: 2,
          limit: 50,
          offset: 0,
          hasMore: false
        }
      });
    });

    it('should filter by tier', async () => {
      const req = createMockReq({}, {}, { tier: 'TIER_1' });
      const res = createMockRes();

      mockCompanyModel.findMany.mockResolvedValue([]);
      mockCompanyModel.count.mockResolvedValue(0);

      await CompanyController.getMany(req, res);

      expect(mockCompanyModel.findMany).toHaveBeenCalledWith(
        { tier: CompanyTier.TIER_1 },
        50,
        0
      );
    });

    it('should filter by search term', async () => {
      const req = createMockReq({}, {}, { search: 'test company' });
      const res = createMockRes();

      mockCompanyModel.findMany.mockResolvedValue([]);
      mockCompanyModel.count.mockResolvedValue(0);

      await CompanyController.getMany(req, res);

      expect(mockCompanyModel.findMany).toHaveBeenCalledWith(
        { search: 'test company' },
        50,
        0
      );
    });

    it('should handle custom pagination', async () => {
      const req = createMockReq({}, {}, { limit: '10', offset: '20' });
      const res = createMockRes();

      mockCompanyModel.findMany.mockResolvedValue([]);
      mockCompanyModel.count.mockResolvedValue(100);

      await CompanyController.getMany(req, res);

      expect(mockCompanyModel.findMany).toHaveBeenCalledWith({}, 10, 20);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [],
        pagination: {
          total: 100,
          limit: 10,
          offset: 20,
          hasMore: true
        }
      });
    });

    it('should limit maximum items per page', async () => {
      const req = createMockReq({}, {}, { limit: '200' }); // Exceeds max
      const res = createMockRes();

      mockCompanyModel.findMany.mockResolvedValue([]);
      mockCompanyModel.count.mockResolvedValue(0);

      await CompanyController.getMany(req, res);

      expect(mockCompanyModel.findMany).toHaveBeenCalledWith({}, 100, 0); // Capped at 100
    });
  });

  describe('update', () => {
    it('should update company successfully', async () => {
      const req = createMockReq(
        { name: 'Updated Company' },
        { id: 'company123' },
        {},
        { userId: 'user123', role: 'TEAM_MEMBER' }
      );
      const res = createMockRes();

      const existingCompany = {
        id: 'company123',
        name: 'Old Company',
        createdBy: 'user123'
      };

      const updatedCompany = {
        id: 'company123',
        name: 'Updated Company',
        createdBy: 'user123'
      };

      mockCompanyModel.findById.mockResolvedValue(existingCompany as any);
      mockCompanyModel.update.mockResolvedValue(updatedCompany as any);

      await CompanyController.update(req, res);

      expect(mockCompanyModel.update).toHaveBeenCalledWith('company123', { name: 'Updated Company' });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: updatedCompany,
        message: 'Company updated successfully'
      });
    });

    it('should return 403 if user does not own company and is not admin', async () => {
      const req = createMockReq(
        { name: 'Updated Company' },
        { id: 'company123' },
        {},
        { userId: 'user456', role: 'TEAM_MEMBER' } // Different user, not admin
      );
      const res = createMockRes();

      const existingCompany = {
        id: 'company123',
        name: 'Old Company',
        createdBy: 'user123' // Different owner
      };

      mockCompanyModel.findById.mockResolvedValue(existingCompany as any);

      await CompanyController.update(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to update this company'
        }
      });
    });

    it('should allow CEO to update any company', async () => {
      const req = createMockReq(
        { name: 'Updated Company' },
        { id: 'company123' },
        {},
        { userId: 'user456', role: 'CEO' } // CEO role
      );
      const res = createMockRes();

      const existingCompany = {
        id: 'company123',
        name: 'Old Company',
        createdBy: 'user123' // Different owner
      };

      const updatedCompany = {
        id: 'company123',
        name: 'Updated Company'
      };

      mockCompanyModel.findById.mockResolvedValue(existingCompany as any);
      mockCompanyModel.update.mockResolvedValue(updatedCompany as any);

      await CompanyController.update(req, res);

      expect(mockCompanyModel.update).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('delete', () => {
    it('should delete company successfully', async () => {
      const req = createMockReq(
        {},
        { id: 'company123' },
        {},
        { userId: 'user123', role: 'TEAM_MEMBER' }
      );
      const res = createMockRes();

      const existingCompany = {
        id: 'company123',
        name: 'Test Company',
        createdBy: 'user123'
      };

      mockCompanyModel.findById.mockResolvedValue(existingCompany as any);
      mockCompanyModel.delete.mockResolvedValue(undefined);

      await CompanyController.delete(req, res);

      expect(mockCompanyModel.delete).toHaveBeenCalledWith('company123');

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Company deleted successfully'
      });
    });

    it('should return 403 if user does not own company and is not admin', async () => {
      const req = createMockReq(
        {},
        { id: 'company123' },
        {},
        { userId: 'user456', role: 'TEAM_MEMBER' }
      );
      const res = createMockRes();

      const existingCompany = {
        id: 'company123',
        name: 'Test Company',
        createdBy: 'user123' // Different owner
      };

      mockCompanyModel.findById.mockResolvedValue(existingCompany as any);

      await CompanyController.delete(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to delete this company'
        }
      });
    });
  });

  describe('updateTiers', () => {
    it('should update tiers successfully for admin user', async () => {
      const req = createMockReq(
        {},
        {},
        {},
        { userId: 'user123', role: 'CEO' }
      );
      const res = createMockRes();

      mockCompanyModel.updateAllTiers.mockResolvedValue(5);

      await CompanyController.updateTiers(req, res);

      expect(mockCompanyModel.updateAllTiers).toHaveBeenCalled();

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          updatedCount: 5
        },
        message: 'Updated 5 company tiers'
      });
    });

    it('should return 403 for non-admin user', async () => {
      const req = createMockReq(
        {},
        {},
        {},
        { userId: 'user123', role: 'TEAM_MEMBER' }
      );
      const res = createMockRes();

      await CompanyController.updateTiers(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to update company tiers'
        }
      });
    });

    it('should return 401 if user not authenticated', async () => {
      const req = createMockReq();
      const res = createMockRes();

      await CompanyController.updateTiers(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
    });
  });
});