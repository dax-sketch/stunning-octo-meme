import { Request, Response } from 'express';
import { AuditService } from '../services/auditService';
import { AUDIT_STATUS, type AuditStatus } from '../config/appwrite';

export class AuditController {
  private auditService: AuditService;

  constructor() {
    this.auditService = new AuditService();
  }

  /**
   * Create a new audit
   */
  createAudit = async (req: Request, res: Response): Promise<void> => {
    try {
      const { companyId, scheduledDate, assignedTo, notes } = req.body;

      if (!companyId || !scheduledDate || !assignedTo) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message:
              'Missing required fields: companyId, scheduledDate, assignedTo',
          },
        });
        return;
      }

      const audit = await this.auditService.createAudit({
        companyId,
        scheduledDate: new Date(scheduledDate),
        assignedTo,
        notes,
      });

      res.status(201).json({
        success: true,
        data: audit,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to create audit',
        },
      });
    }
  };

  /**
   * Get all audits with optional filtering
   */
  getAudits = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        companyId,
        assignedTo,
        status,
        scheduledDateFrom,
        scheduledDateTo,
        search,
        limit = '50',
        offset = '0',
      } = req.query;

      const filters: any = {};
      if (companyId) filters.companyId = companyId as string;
      if (assignedTo) filters.assignedTo = assignedTo as string;
      if (status) filters.status = status as AuditStatus;
      if (scheduledDateFrom)
        filters.scheduledDateFrom = new Date(scheduledDateFrom as string);
      if (scheduledDateTo)
        filters.scheduledDateTo = new Date(scheduledDateTo as string);

      const audits = await this.auditService.getAudits(filters);

      // Apply search filter if provided
      let filteredAudits = audits;
      if (search) {
        const searchTerm = (search as string).toLowerCase();
        filteredAudits = audits.filter(
          (audit) =>
            audit.notes?.toLowerCase().includes(searchTerm) ||
            audit.assignedTo.toLowerCase().includes(searchTerm) ||
            audit.companyName?.toLowerCase().includes(searchTerm)
        );
      }

      // Apply pagination
      const limitNum = parseInt(limit as string);
      const offsetNum = parseInt(offset as string);
      const paginatedAudits = filteredAudits.slice(
        offsetNum,
        offsetNum + limitNum
      );

      res.json({
        success: true,
        data: paginatedAudits,
        total: filteredAudits.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to fetch audits',
        },
      });
    }
  };

  /**
   * Get audit by ID
   */
  getAuditById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Audit ID is required',
          },
        });
        return;
      }

      const audit = await this.auditService.getAuditById(id);
      if (!audit) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Audit not found',
          },
        });
        return;
      }

      res.json({
        success: true,
        data: audit,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to fetch audit',
        },
      });
    }
  };

  /**
   * Update audit
   */
  updateAudit = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Audit ID is required',
          },
        });
        return;
      }

      const updateData = req.body;

      // Convert date strings to Date objects if provided
      if (updateData.scheduledDate) {
        updateData.scheduledDate = new Date(updateData.scheduledDate);
      }
      if (updateData.completedDate) {
        updateData.completedDate = new Date(updateData.completedDate);
      }

      const audit = await this.auditService.updateAudit(id, updateData);
      if (!audit) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Audit not found',
          },
        });
        return;
      }

      res.json({
        success: true,
        data: audit,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to update audit',
        },
      });
    }
  };

  /**
   * Delete audit
   */
  deleteAudit = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Audit ID is required',
          },
        });
        return;
      }

      const success = await this.auditService.deleteAudit(id);
      if (!success) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Audit not found',
          },
        });
        return;
      }

      res.json({
        success: true,
        message: 'Audit deleted successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to delete audit',
        },
      });
    }
  };

  /**
   * Get audits for a specific company
   */
  getCompanyAudits = async (req: Request, res: Response): Promise<void> => {
    try {
      const { companyId } = req.params;

      if (!companyId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Company ID is required',
          },
        });
        return;
      }

      const audits = await this.auditService.getAuditsByCompany(companyId);

      res.json({
        success: true,
        data: audits,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to fetch company audits',
        },
      });
    }
  };

  /**
   * Mark audit as completed
   */
  completeAudit = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { notes } = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Audit ID is required',
          },
        });
        return;
      }

      const audit = await this.auditService.completeAudit(id, notes);
      if (!audit) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Audit not found',
          },
        });
        return;
      }

      res.json({
        success: true,
        data: audit,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to complete audit',
        },
      });
    }
  };

  /**
   * Schedule initial audits for a company
   */
  scheduleInitialAudits = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { companyId, assignedTo } = req.body;

      if (!companyId || !assignedTo) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Missing required fields: companyId, assignedTo',
          },
        });
        return;
      }

      const audits = await this.auditService.scheduleInitialAudits({
        companyId,
        assignedTo,
      });

      res.status(201).json({
        success: true,
        data: audits,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to schedule initial audits',
        },
      });
    }
  };

  /**
   * Update audit schedules for all companies
   */
  updateAllAuditSchedules = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const result =
        await this.auditService.updateAuditSchedulesForAllCompanies();

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to update audit schedules',
        },
      });
    }
  };

  /**
   * Get upcoming audits
   */
  getUpcomingAudits = async (req: Request, res: Response): Promise<void> => {
    try {
      const { days = '7' } = req.query;
      const daysNum = parseInt(days as string);

      const audits = await this.auditService.getUpcomingAudits(daysNum);

      res.json({
        success: true,
        data: audits,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to fetch upcoming audits',
        },
      });
    }
  };

  /**
   * Get audit statistics
   */
  getAuditStatistics = async (req: Request, res: Response): Promise<void> => {
    try {
      const statistics = await this.auditService.getAuditStatistics();

      res.json({
        success: true,
        data: statistics,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to fetch audit statistics',
        },
      });
    }
  };

  /**
   * Process overdue audits
   */
  processOverdueAudits = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.auditService.processOverdueAudits();

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to process overdue audits',
        },
      });
    }
  };
}
