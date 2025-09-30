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
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
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
import { CompanyModel } from '../models/Company';
import { CompanyTier } from '@prisma/client';

// Create mock Prisma client
const mockPrisma = {
  company: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn()
  }
} as any;

describe('CompanyModel', () => {
  beforeAll(() => {
    // Set the mock Prisma client
    CompanyModel.setPrismaClient(mockPrisma);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateTier', () => {
    it('should return TIER_1 for high ad spend companies', () => {
      const company = {
        startDate: new Date('2020-01-01'),
        adSpend: 6000
      };

      const tier = CompanyModel.calculateTier(company);
      expect(tier).toBe(CompanyTier.TIER_1);
    });

    it('should return TIER_2 for new companies with low ad spend', () => {
      const company = {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 1 month ago
        adSpend: 1000
      };

      const tier = CompanyModel.calculateTier(company);
      expect(tier).toBe(CompanyTier.TIER_2);
    });

    it('should return TIER_3 for old companies with low ad spend', () => {
      const company = {
        startDate: new Date('2020-01-01'), // Old company
        adSpend: 1000 // Low ad spend
      };

      const tier = CompanyModel.calculateTier(company);
      expect(tier).toBe(CompanyTier.TIER_3);
    });

    it('should return TIER_1 for old companies with high ad spend', () => {
      const company = {
        startDate: new Date('2020-01-01'), // Old company
        adSpend: 8000 // High ad spend
      };

      const tier = CompanyModel.calculateTier(company);
      expect(tier).toBe(CompanyTier.TIER_1);
    });
  });

  describe('create', () => {
    it('should create a company with valid data', async () => {
      const companyData = {
        name: 'Test Company',
        startDate: new Date('2023-01-01'),
        phoneNumber: '+1234567890',
        email: 'test@company.com',
        website: 'https://test.com',
        adSpend: 3000,
        createdBy: 'user123'
      };

      const expectedCompany = {
        id: 'company123',
        ...companyData,
        tier: CompanyTier.TIER_3,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.company.findFirst.mockResolvedValue(null);
      mockPrisma.company.create.mockResolvedValue(expectedCompany);

      const result = await CompanyModel.create(companyData);

      expect(mockPrisma.company.findFirst).toHaveBeenCalledWith({
        where: {
          name: companyData.name,
          createdBy: companyData.createdBy
        }
      });

      expect(mockPrisma.company.create).toHaveBeenCalledWith({
        data: {
          ...companyData,
          tier: CompanyTier.TIER_3,
          adSpend: 3000
        }
      });

      expect(result).toEqual(expectedCompany);
    });

    it('should throw error for invalid email', async () => {
      const companyData = {
        name: 'Test Company',
        startDate: new Date('2023-01-01'),
        phoneNumber: '+1234567890',
        email: 'invalid-email',
        createdBy: 'user123'
      };

      await expect(CompanyModel.create(companyData)).rejects.toThrow('Validation error');
    });

    it('should throw error for duplicate company name', async () => {
      const companyData = {
        name: 'Test Company',
        startDate: new Date('2023-01-01'),
        phoneNumber: '+1234567890',
        email: 'test@company.com',
        createdBy: 'user123'
      };

      mockPrisma.company.findFirst.mockResolvedValue({ id: 'existing123' });

      await expect(CompanyModel.create(companyData)).rejects.toThrow('Company with this name already exists');
    });

    it('should throw error for future start date', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const companyData = {
        name: 'Test Company',
        startDate: futureDate,
        phoneNumber: '+1234567890',
        email: 'test@company.com',
        createdBy: 'user123'
      };

      await expect(CompanyModel.create(companyData)).rejects.toThrow('Validation error');
    });
  });

  describe('findById', () => {
    it('should return company with relations', async () => {
      const companyId = 'company123';
      const expectedCompany = {
        id: companyId,
        name: 'Test Company',
        creator: { id: 'user123', username: 'testuser', email: 'test@user.com' },
        notes: []
      };

      mockPrisma.company.findUnique.mockResolvedValue(expectedCompany);

      const result = await CompanyModel.findById(companyId);

      expect(mockPrisma.company.findUnique).toHaveBeenCalledWith({
        where: { id: companyId },
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              email: true
            }
          },
          notes: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true
                }
              }
            },
            orderBy: {
              createdAt: 'desc'
            }
          }
        }
      });

      expect(result).toEqual(expectedCompany);
    });

    it('should return null for non-existent company', async () => {
      mockPrisma.company.findUnique.mockResolvedValue(null);

      const result = await CompanyModel.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findMany', () => {
    it('should return companies with default parameters', async () => {
      const expectedCompanies = [
        { id: 'company1', name: 'Company 1' },
        { id: 'company2', name: 'Company 2' }
      ];

      mockPrisma.company.findMany.mockResolvedValue(expectedCompanies);

      const result = await CompanyModel.findMany();

      expect(mockPrisma.company.findMany).toHaveBeenCalledWith({
        where: {},
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 50,
        skip: 0
      });

      expect(result).toEqual(expectedCompanies);
    });

    it('should filter by tier', async () => {
      const filters = { tier: CompanyTier.TIER_1 };
      mockPrisma.company.findMany.mockResolvedValue([]);

      await CompanyModel.findMany(filters);

      expect(mockPrisma.company.findMany).toHaveBeenCalledWith({
        where: { tier: CompanyTier.TIER_1 },
        include: expect.any(Object),
        orderBy: expect.any(Object),
        take: 50,
        skip: 0
      });
    });

    it('should filter by search term', async () => {
      const filters = { search: 'test' };
      mockPrisma.company.findMany.mockResolvedValue([]);

      await CompanyModel.findMany(filters);

      expect(mockPrisma.company.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { name: { contains: 'test', mode: 'insensitive' } },
            { email: { contains: 'test', mode: 'insensitive' } }
          ]
        },
        include: expect.any(Object),
        orderBy: expect.any(Object),
        take: 50,
        skip: 0
      });
    });
  });

  describe('update', () => {
    it('should update company with valid data', async () => {
      const companyId = 'company123';
      const updateData = {
        name: 'Updated Company',
        adSpend: 7000
      };

      const existingCompany = {
        id: companyId,
        name: 'Old Company',
        startDate: new Date('2023-01-01'),
        adSpend: 3000,
        tier: CompanyTier.TIER_3,
        createdBy: 'user123'
      };

      const updatedCompany = {
        ...existingCompany,
        ...updateData,
        tier: CompanyTier.TIER_1 // Should be recalculated
      };

      mockPrisma.company.findUnique.mockResolvedValue(existingCompany);
      mockPrisma.company.findFirst.mockResolvedValue(null); // No duplicate name
      mockPrisma.company.update.mockResolvedValue(updatedCompany);

      const result = await CompanyModel.update(companyId, updateData);

      expect(mockPrisma.company.update).toHaveBeenCalledWith({
        where: { id: companyId },
        data: {
          ...updateData,
          tier: CompanyTier.TIER_1
        }
      });

      expect(result).toEqual(updatedCompany);
    });

    it('should throw error for non-existent company', async () => {
      mockPrisma.company.findUnique.mockResolvedValue(null);

      await expect(CompanyModel.update('nonexistent', { name: 'New Name' }))
        .rejects.toThrow('Company not found');
    });

    it('should throw error for duplicate name', async () => {
      const companyId = 'company123';
      const updateData = { name: 'Duplicate Name' };

      const existingCompany = {
        id: companyId,
        name: 'Old Name',
        createdBy: 'user123'
      };

      const duplicateCompany = {
        id: 'other123',
        name: 'Duplicate Name'
      };

      mockPrisma.company.findUnique.mockResolvedValue(existingCompany);
      mockPrisma.company.findFirst.mockResolvedValue(duplicateCompany);

      await expect(CompanyModel.update(companyId, updateData))
        .rejects.toThrow('Company with this name already exists');
    });
  });

  describe('delete', () => {
    it('should delete existing company', async () => {
      const companyId = 'company123';
      const existingCompany = { id: companyId, name: 'Test Company' };

      mockPrisma.company.findUnique.mockResolvedValue(existingCompany);
      mockPrisma.company.delete.mockResolvedValue(existingCompany);

      await CompanyModel.delete(companyId);

      expect(mockPrisma.company.delete).toHaveBeenCalledWith({
        where: { id: companyId }
      });
    });

    it('should throw error for non-existent company', async () => {
      mockPrisma.company.findUnique.mockResolvedValue(null);

      await expect(CompanyModel.delete('nonexistent'))
        .rejects.toThrow('Company not found');
    });
  });

  describe('count', () => {
    it('should return count with filters', async () => {
      const filters = { tier: CompanyTier.TIER_1 };
      mockPrisma.company.count.mockResolvedValue(5);

      const result = await CompanyModel.count(filters);

      expect(mockPrisma.company.count).toHaveBeenCalledWith({
        where: { tier: CompanyTier.TIER_1 }
      });

      expect(result).toBe(5);
    });
  });

  describe('updateAllTiers', () => {
    it('should update tiers for companies that need it', async () => {
      const companies = [
        {
          id: 'company1',
          startDate: new Date('2020-01-01'),
          adSpend: 6000,
          tier: CompanyTier.TIER_3 // Should be TIER_1
        },
        {
          id: 'company2',
          startDate: new Date('2020-01-01'),
          adSpend: 1000,
          tier: CompanyTier.TIER_3 // Correct tier
        }
      ];

      mockPrisma.company.findMany.mockResolvedValue(companies);
      mockPrisma.company.update.mockResolvedValue({});

      const result = await CompanyModel.updateAllTiers();

      expect(mockPrisma.company.update).toHaveBeenCalledTimes(1);
      expect(mockPrisma.company.update).toHaveBeenCalledWith({
        where: { id: 'company1' },
        data: { tier: CompanyTier.TIER_1 }
      });

      expect(result).toBe(1);
    });
  });
});