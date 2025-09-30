import { Request, Response } from 'express';
import { PaymentService } from '../services/paymentService';
import { JwtPayload } from '../utils/jwt';

interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export class PaymentController {
  private paymentService: PaymentService;

  constructor() {
    this.paymentService = new PaymentService();
  }

  /**
   * Create a new payment record
   */
  createPayment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { companyId, amount, paymentDate, notes } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User authentication required',
          },
        });
        return;
      }

      if (!companyId || !amount || !paymentDate) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Missing required fields: companyId, amount, paymentDate',
          },
        });
        return;
      }

      // Validate amount is positive
      const paymentAmount = parseFloat(amount);
      if (isNaN(paymentAmount) || paymentAmount <= 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Amount must be a positive number',
          },
        });
        return;
      }

      // Validate payment date
      const paymentDateObj = new Date(paymentDate);
      if (isNaN(paymentDateObj.getTime())) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid payment date format',
          },
        });
        return;
      }

      const payment = await this.paymentService.createPayment({
        companyId,
        amount: paymentAmount,
        paymentDate: paymentDateObj,
        createdBy: userId,
        notes,
      });

      res.status(201).json({
        success: true,
        data: payment,
      });
    } catch (error: any) {
      console.error('Error creating payment:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to create payment record',
        },
      });
    }
  };

  /**
   * Get all payments
   */
  getPayments = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { companyId, paymentDateFrom, paymentDateTo, limit, offset } = req.query;
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User authentication required',
          },
        });
        return;
      }

      const filters: any = {};
      if (companyId) filters.companyId = companyId as string;
      if (paymentDateFrom) filters.paymentDateFrom = new Date(paymentDateFrom as string);
      if (paymentDateTo) filters.paymentDateTo = new Date(paymentDateTo as string);
      if (limit) filters.limit = parseInt(limit as string);
      if (offset) filters.offset = parseInt(offset as string);

      const payments = await this.paymentService.getPayments(filters);

      res.json({
        success: true,
        data: payments,
      });
    } catch (error: any) {
      console.error('Error fetching payments:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to fetch payments',
        },
      });
    }
  };

  /**
   * Get recent payments
   */
  getRecentPayments = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { days = '30' } = req.query;
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User authentication required',
          },
        });
        return;
      }

      const daysNum = parseInt(days as string);
      const payments = await this.paymentService.getRecentPayments(daysNum);

      res.json({
        success: true,
        data: payments,
      });
    } catch (error: any) {
      console.error('Error fetching recent payments:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to fetch recent payments',
        },
      });
    }
  };

  /**
   * Get payment by ID
   */
  getPaymentById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User authentication required',
          },
        });
        return;
      }

      if (!id) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Payment ID is required',
          },
        });
        return;
      }

      const payment = await this.paymentService.getPaymentById(id);
      if (!payment) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Payment not found',
          },
        });
        return;
      }

      res.json({
        success: true,
        data: payment,
      });
    } catch (error: any) {
      console.error('Error fetching payment:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to fetch payment',
        },
      });
    }
  };

  /**
   * Update payment
   */
  updatePayment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { amount, paymentDate, notes } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User authentication required',
          },
        });
        return;
      }

      if (!id) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Payment ID is required',
          },
        });
        return;
      }

      const updateData: any = {};
      
      if (amount !== undefined) {
        const paymentAmount = parseFloat(amount);
        if (isNaN(paymentAmount) || paymentAmount <= 0) {
          res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Amount must be a positive number',
            },
          });
          return;
        }
        updateData.amount = paymentAmount;
      }

      if (paymentDate) {
        const paymentDateObj = new Date(paymentDate);
        if (isNaN(paymentDateObj.getTime())) {
          res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid payment date format',
            },
          });
          return;
        }
        updateData.paymentDate = paymentDateObj;
      }

      if (notes !== undefined) updateData.notes = notes;

      const payment = await this.paymentService.updatePayment(id, updateData);
      if (!payment) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Payment not found',
          },
        });
        return;
      }

      res.json({
        success: true,
        data: payment,
      });
    } catch (error: any) {
      console.error('Error updating payment:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to update payment',
        },
      });
    }
  };

  /**
   * Delete payment
   */
  deletePayment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User authentication required',
          },
        });
        return;
      }

      if (!id) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Payment ID is required',
          },
        });
        return;
      }

      await this.paymentService.deletePayment(id);

      res.json({
        success: true,
        message: 'Payment deleted successfully',
      });
    } catch (error: any) {
      console.error('Error deleting payment:', error);
      
      if (error.message === 'Payment not found') {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: error.message,
          },
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to delete payment',
        },
      });
    }
  };
}