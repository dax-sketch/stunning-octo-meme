import { Request, Response } from 'express';
import { CompanyModel, CreateCompanyData, UpdateCompanyData, CompanyFilters, AppwriteCompany } from '../models/AppwriteCompany';
import { COMPANY_TIERS, type CompanyTier } from '../config/appwrite';
import { AuditService } from '../services/auditService';
import { JwtPayload } from '../utils/jwt';

// Helper function to transform Appwrite company to frontend format
function transformCompanyForFrontend(company: AppwriteCompany) {
  return {
    id: company.$id,
    name: company.name,
    startDate: company.startDate,
    phoneNumber: company.phoneNumber,
    email: company.email,
    website: company.website || '',
    tier: company.tier,
    adSpend: company.adSpend,
    lastPaymentDate: company.lastPaymentDate,
    lastPaymentAmount: company.lastPaymentAmount,
    lastMeetingDate: company.lastMeetingDate,
    lastMeetingAttendees: company.lastMeetingAttendees ? JSON.parse(company.lastMeetingAttendees) : [],
    lastMeetingDuration: company.lastMeetingDuration,
    createdBy: company.createdBy,
    createdAt: company.$createdAt,
    updatedAt: company.$updatedAt,
  };
}

// Extend Request interface to include user from auth middleware
interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export class CompanyController {
  // Create new company
  static async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required'
          }
        });
        return;
      }

      const companyData: CreateCompanyData = {
        ...req.body,
        startDate: new Date(req.body.startDate),
        createdBy: req.user.userId
      };

      const company = await CompanyModel.create(companyData);

      // Automatically schedule an audit for the new company
      try {
        const auditService = new AuditService();
        await auditService.scheduleAuditForNewCompany(company.$id, req.user.userId);
        console.log(`Automatically scheduled audit for new company: ${company.name}`);
      } catch (auditError) {
        console.error('Failed to schedule audit for new company:', auditError);
        // Don't fail the company creation if audit scheduling fails
      }

      res.status(201).json({
        success: true,
        data: transformCompanyForFrontend(company),
        message: 'Company created successfully'
      });
    } catch (error: any) {
      console.error('Error creating company:', error);
      
      if (error.message.includes('Validation error')) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.message
          }
        });
        return;
      }

      if (error.message.includes('already exists')) {
        res.status(409).json({
          success: false,
          error: {
            code: 'DUPLICATE_COMPANY',
            message: error.message
          }
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create company'
        }
      });
    }
  }

  // Get company by ID
  static async getById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_PARAMETER',
            message: 'Company ID is required'
          }
        });
        return;
      }

      const company = await CompanyModel.findById(id);

      if (!company) {
        res.status(404).json({
          success: false,
          error: {
            code: 'COMPANY_NOT_FOUND',
            message: 'Company not found'
          }
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: transformCompanyForFrontend(company)
      });
    } catch (error: any) {
      console.error('Error fetching company:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch company'
        }
      });
    }
  }

  // Get companies with filtering and pagination
  static async getMany(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const {
        tier,
        search,
        createdBy,
        startDateFrom,
        startDateTo,
        limit = '50',
        offset = '0'
      } = req.query;

      // Parse and validate query parameters
      const parsedLimit = Math.min(parseInt(limit as string) || 50, 100); // Max 100 items
      const parsedOffset = Math.max(parseInt(offset as string) || 0, 0);

      const filters: CompanyFilters = {};

      if (tier && Object.values(COMPANY_TIERS).includes(tier as CompanyTier)) {
        filters.tier = tier as CompanyTier;
      }

      if (search && typeof search === 'string') {
        filters.search = search.trim();
      }

      if (createdBy && typeof createdBy === 'string') {
        filters.createdBy = createdBy;
      }

      if (startDateFrom && typeof startDateFrom === 'string') {
        const date = new Date(startDateFrom);
        if (!isNaN(date.getTime())) {
          filters.startDateFrom = date;
        }
      }

      if (startDateTo && typeof startDateTo === 'string') {
        const date = new Date(startDateTo);
        if (!isNaN(date.getTime())) {
          filters.startDateTo = date;
        }
      }

      // Get companies and total count
      const [companies, totalCount] = await Promise.all([
        CompanyModel.findMany(filters, parsedLimit, parsedOffset),
        CompanyModel.count(filters)
      ]);

      res.status(200).json({
        success: true,
        data: companies.map(transformCompanyForFrontend),
        pagination: {
          total: totalCount,
          limit: parsedLimit,
          offset: parsedOffset,
          hasMore: parsedOffset + parsedLimit < totalCount
        }
      });
    } catch (error: any) {
      console.error('Error fetching companies:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch companies'
        }
      });
    }
  }

  // Update company
  static async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required'
          }
        });
        return;
      }

      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_PARAMETER',
            message: 'Company ID is required'
          }
        });
        return;
      }

      // Check if company exists and user has permission
      const existingCompany = await CompanyModel.findById(id);
      if (!existingCompany) {
        res.status(404).json({
          success: false,
          error: {
            code: 'COMPANY_NOT_FOUND',
            message: 'Company not found'
          }
        });
        return;
      }

      // Check if user has permission to update (owner or admin)
      if (existingCompany.createdBy !== req.user.userId && req.user.role !== 'CEO' && req.user.role !== 'MANAGER') {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to update this company'
          }
        });
        return;
      }

      const updateData: UpdateCompanyData = req.body;
      const updatedCompany = await CompanyModel.update(id, updateData);

      res.status(200).json({
        success: true,
        data: transformCompanyForFrontend(updatedCompany),
        message: 'Company updated successfully'
      });
    } catch (error: any) {
      console.error('Error updating company:', error);

      if (error.message.includes('Validation error')) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.message
          }
        });
        return;
      }

      if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: {
            code: 'COMPANY_NOT_FOUND',
            message: error.message
          }
        });
        return;
      }

      if (error.message.includes('already exists')) {
        res.status(409).json({
          success: false,
          error: {
            code: 'DUPLICATE_COMPANY',
            message: error.message
          }
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update company'
        }
      });
    }
  }

  // Delete company
  static async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required'
          }
        });
        return;
      }

      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_PARAMETER',
            message: 'Company ID is required'
          }
        });
        return;
      }

      // Check if company exists and user has permission
      const existingCompany = await CompanyModel.findById(id);
      if (!existingCompany) {
        res.status(404).json({
          success: false,
          error: {
            code: 'COMPANY_NOT_FOUND',
            message: 'Company not found'
          }
        });
        return;
      }

      // Check if user has permission to delete (owner or admin)
      if (existingCompany.createdBy !== req.user.userId && req.user.role !== 'CEO' && req.user.role !== 'MANAGER') {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to delete this company'
          }
        });
        return;
      }

      // Delete associated audits first
      try {
        const auditService = new AuditService();
        const companyAudits = await auditService.getAuditsByCompany(id);
        console.log(`Deleting ${companyAudits.length} audits for company ${existingCompany.name}`);
        
        for (const audit of companyAudits) {
          await auditService.deleteAudit(audit.$id);
        }
      } catch (auditError) {
        console.error('Error deleting company audits:', auditError);
        // Continue with company deletion even if audit deletion fails
      }

      await CompanyModel.delete(id);

      res.status(200).json({
        success: true,
        message: 'Company and associated audits deleted successfully'
      });
    } catch (error: any) {
      console.error('Error deleting company:', error);

      if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: {
            code: 'COMPANY_NOT_FOUND',
            message: error.message
          }
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete company'
        }
      });
    }
  }

  // Update payment data for a company
  static async updatePaymentData(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required'
          }
        });
        return;
      }

      const { id } = req.params;
      const { lastPaymentDate, lastPaymentAmount } = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_PARAMETER',
            message: 'Company ID is required'
          }
        });
        return;
      }

      // Validate payment data
      if (!lastPaymentDate || !lastPaymentAmount) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Payment date and amount are required'
          }
        });
        return;
      }

      if (typeof lastPaymentAmount !== 'number' || lastPaymentAmount <= 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Payment amount must be a positive number'
          }
        });
        return;
      }

      const paymentDate = new Date(lastPaymentDate);
      if (isNaN(paymentDate.getTime())) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid payment date format'
          }
        });
        return;
      }

      // Check if company exists and user has permission
      const existingCompany = await CompanyModel.findById(id);
      if (!existingCompany) {
        res.status(404).json({
          success: false,
          error: {
            code: 'COMPANY_NOT_FOUND',
            message: 'Company not found'
          }
        });
        return;
      }

      // Check if user has permission to update (owner or admin)
      if (existingCompany.createdBy !== req.user.userId && req.user.role !== 'CEO' && req.user.role !== 'MANAGER') {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to update this company'
          }
        });
        return;
      }

      const updatedCompany = await CompanyModel.update(id, {
        lastPaymentDate: paymentDate,
        lastPaymentAmount
      });

      res.status(200).json({
        success: true,
        data: updatedCompany,
        message: 'Payment data updated successfully'
      });
    } catch (error: any) {
      console.error('Error updating payment data:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update payment data'
        }
      });
    }
  }

  // Update meeting data for a company
  static async updateMeetingData(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required'
          }
        });
        return;
      }

      const { id } = req.params;
      const { lastMeetingDate, lastMeetingAttendees, lastMeetingDuration } = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_PARAMETER',
            message: 'Company ID is required'
          }
        });
        return;
      }

      // Validate meeting data
      if (!lastMeetingDate) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Meeting date is required'
          }
        });
        return;
      }

      const meetingDate = new Date(lastMeetingDate);
      if (isNaN(meetingDate.getTime())) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid meeting date format'
          }
        });
        return;
      }

      if (lastMeetingAttendees && !Array.isArray(lastMeetingAttendees)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Meeting attendees must be an array of strings'
          }
        });
        return;
      }

      if (lastMeetingDuration && (typeof lastMeetingDuration !== 'number' || lastMeetingDuration <= 0)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Meeting duration must be a positive number (in minutes)'
          }
        });
        return;
      }

      // Check if company exists and user has permission
      const existingCompany = await CompanyModel.findById(id);
      if (!existingCompany) {
        res.status(404).json({
          success: false,
          error: {
            code: 'COMPANY_NOT_FOUND',
            message: 'Company not found'
          }
        });
        return;
      }

      // Check if user has permission to update (owner or admin)
      if (existingCompany.createdBy !== req.user.userId && req.user.role !== 'CEO' && req.user.role !== 'MANAGER') {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to update this company'
          }
        });
        return;
      }

      const updateData: any = {
        lastMeetingDate: meetingDate
      };

      if (lastMeetingAttendees) {
        updateData.lastMeetingAttendees = lastMeetingAttendees;
      }

      if (lastMeetingDuration) {
        updateData.lastMeetingDuration = lastMeetingDuration;
      }

      const updatedCompany = await CompanyModel.update(id, updateData);

      res.status(200).json({
        success: true,
        data: updatedCompany,
        message: 'Meeting data updated successfully'
      });
    } catch (error: any) {
      console.error('Error updating meeting data:', error);
      res.status(500).json({
        success: false,
        error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to update meeting data'
          }
        });
    }
  }

  // Update all company tiers (admin only)
  static async updateTiers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required'
          }
        });
        return;
      }

      // Only CEO and MANAGER can update tiers
      if (req.user.role !== 'CEO' && req.user.role !== 'MANAGER') {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to update company tiers'
          }
        });
        return;
      }

      const updatedCount = await CompanyModel.updateAllTiers();

      res.status(200).json({
        success: true,
        data: {
          updatedCount
        },
        message: `Updated ${updatedCount} company tiers`
      });
    } catch (error: any) {
      console.error('Error updating company tiers:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update company tiers'
        }
      });
    }
  }
}