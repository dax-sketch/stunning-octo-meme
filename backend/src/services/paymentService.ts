import {
  PaymentModel,
  CreatePaymentData,
  UpdatePaymentData,
  PaymentWithDetails,
  AppwritePayment,
} from '../models/AppwritePayment';
import { CompanyModel } from '../models/AppwriteCompany';
import { UserModel } from '../models/AppwriteUser';

export class PaymentService {
  /**
   * Create a new payment record
   */
  async createPayment(data: CreatePaymentData): Promise<PaymentWithDetails> {
    // Validate that company exists
    const company = await CompanyModel.findById(data.companyId);
    if (!company) {
      throw new Error('Company not found');
    }

    // Validate that user exists
    const user = await UserModel.findById(data.createdBy);
    if (!user) {
      throw new Error('User not found');
    }

    const payment = await PaymentModel.create(data);
    
    // Update company's last payment information
    await CompanyModel.update(data.companyId, {
      lastPaymentDate: data.paymentDate,
      lastPaymentAmount: data.amount,
    });

    return await this.populatePaymentDetails(payment);
  }

  /**
   * Get payment by ID
   */
  async getPaymentById(id: string): Promise<PaymentWithDetails | null> {
    const payment = await PaymentModel.findById(id);
    if (!payment) return null;

    return await this.populatePaymentDetails(payment);
  }

  /**
   * Get payments with filtering
   */
  async getPayments(
    filters: {
      companyId?: string;
      createdBy?: string;
      paymentDateFrom?: Date;
      paymentDateTo?: Date;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<PaymentWithDetails[]> {
    const payments = await PaymentModel.findMany(filters);
    return await Promise.all(
      payments.map((payment) => this.populatePaymentDetails(payment))
    );
  }

  /**
   * Get recent payments
   */
  async getRecentPayments(days: number = 30): Promise<PaymentWithDetails[]> {
    const payments = await PaymentModel.findRecent(days);
    return await Promise.all(
      payments.map((payment) => this.populatePaymentDetails(payment))
    );
  }

  /**
   * Update payment
   */
  async updatePayment(
    id: string,
    data: UpdatePaymentData
  ): Promise<PaymentWithDetails | null> {
    const existingPayment = await PaymentModel.findById(id);
    if (!existingPayment) {
      throw new Error('Payment not found');
    }

    const updatedPayment = await PaymentModel.update(id, data);
    
    // If amount or date changed, update company's last payment info
    if (data.amount !== undefined || data.paymentDate) {
      const company = await CompanyModel.findById(existingPayment.companyId);
      if (company) {
        const updateData: any = {};
        if (data.amount !== undefined) updateData.lastPaymentAmount = data.amount;
        if (data.paymentDate) updateData.lastPaymentDate = data.paymentDate;
        
        if (Object.keys(updateData).length > 0) {
          await CompanyModel.update(existingPayment.companyId, updateData);
        }
      }
    }

    return await this.populatePaymentDetails(updatedPayment);
  }

  /**
   * Delete payment
   */
  async deletePayment(id: string): Promise<boolean> {
    const existingPayment = await PaymentModel.findById(id);
    if (!existingPayment) {
      throw new Error('Payment not found');
    }

    await PaymentModel.delete(id);
    return true;
  }

  /**
   * Get payments for a specific company
   */
  async getPaymentsByCompany(companyId: string): Promise<PaymentWithDetails[]> {
    return await this.getPayments({ companyId });
  }

  /**
   * Populate payment with company and user details
   */
  private async populatePaymentDetails(
    payment: AppwritePayment
  ): Promise<PaymentWithDetails> {
    const [company, user] = await Promise.all([
      CompanyModel.findById(payment.companyId),
      UserModel.findById(payment.createdBy),
    ]);

    const result: PaymentWithDetails = {
      id: payment.$id,
      companyId: payment.companyId,
      companyName: company?.name || 'Unknown Company',
      amount: payment.amount,
      paymentDate: payment.paymentDate,
      createdBy: payment.createdBy,
      createdByUsername: user?.username || 'Unknown User',
      createdAt: payment.$createdAt,
      updatedAt: payment.$updatedAt,
    };

    // Only add notes if it exists and is not empty
    if (payment.notes && payment.notes.trim()) {
      result.notes = payment.notes;
    }

    return result;
  }
}