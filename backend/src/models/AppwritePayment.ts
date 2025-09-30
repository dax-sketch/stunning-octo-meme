import { databases } from '../config/appwrite';
import { COLLECTIONS } from '../config/appwrite';
import { ID, Query } from 'appwrite';

export interface CreatePaymentData {
  companyId: string;
  amount: number;
  paymentDate: Date;
  createdBy: string;
  notes?: string;
}

export interface UpdatePaymentData {
  amount?: number;
  paymentDate?: Date;
  notes?: string;
}

export interface AppwritePayment {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  companyId: string;
  amount: number;
  paymentDate: string;
  createdBy: string;
  notes?: string;
}

export interface PaymentWithDetails
  extends Omit<AppwritePayment, '$id' | '$createdAt' | '$updatedAt'> {
  id: string;
  companyName: string;
  createdAt: string;
  updatedAt: string;
  createdByUsername?: string;
}

export class PaymentModel {
  private static databaseId =
    process.env.APPWRITE_DATABASE_ID || 'client-management';
  private static collectionId = COLLECTIONS.PAYMENTS;

  /**
   * Create a new payment record
   */
  static async create(data: CreatePaymentData): Promise<AppwritePayment> {
    try {
      const paymentData = {
        companyId: data.companyId,
        amount: data.amount,
        paymentDate: data.paymentDate.toISOString(),
        createdBy: data.createdBy,
        notes: data.notes || '',
      };

      const payment = await databases.createDocument(
        this.databaseId,
        this.collectionId,
        ID.unique(),
        paymentData
      );

      return payment as unknown as AppwritePayment;
    } catch (error) {
      console.error('Error creating payment:', error);
      throw new Error('Failed to create payment record');
    }
  }

  /**
   * Find payment by ID
   */
  static async findById(id: string): Promise<AppwritePayment | null> {
    try {
      const payment = await databases.getDocument(
        this.databaseId,
        this.collectionId,
        id
      );

      return payment as unknown as AppwritePayment;
    } catch (error) {
      console.error('Error finding payment by ID:', error);
      return null;
    }
  }

  /**
   * Find payments with filtering
   */
  static async findMany(
    filters: {
      companyId?: string;
      createdBy?: string;
      paymentDateFrom?: Date;
      paymentDateTo?: Date;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<AppwritePayment[]> {
    try {
      const queries: string[] = [];

      if (filters.companyId) {
        queries.push(Query.equal('companyId', filters.companyId));
      }

      if (filters.createdBy) {
        queries.push(Query.equal('createdBy', filters.createdBy));
      }

      if (filters.paymentDateFrom) {
        queries.push(
          Query.greaterThanEqual(
            'paymentDate',
            filters.paymentDateFrom.toISOString()
          )
        );
      }

      if (filters.paymentDateTo) {
        queries.push(
          Query.lessThanEqual(
            'paymentDate',
            filters.paymentDateTo.toISOString()
          )
        );
      }

      // Add ordering by payment date (newest first)
      queries.push(Query.orderDesc('paymentDate'));

      if (filters.limit) {
        queries.push(Query.limit(filters.limit));
      }

      if (filters.offset) {
        queries.push(Query.offset(filters.offset));
      }

      const response = await databases.listDocuments(
        this.databaseId,
        this.collectionId,
        queries
      );

      return response.documents as unknown as AppwritePayment[];
    } catch (error) {
      console.error('Error finding payments:', error);
      return [];
    }
  }

  /**
   * Update payment
   */
  static async update(
    id: string,
    data: UpdatePaymentData
  ): Promise<AppwritePayment> {
    try {
      const updateData: any = {};

      if (data.amount !== undefined) updateData.amount = data.amount;
      if (data.paymentDate)
        updateData.paymentDate = data.paymentDate.toISOString();
      if (data.notes !== undefined) updateData.notes = data.notes;

      const payment = await databases.updateDocument(
        this.databaseId,
        this.collectionId,
        id,
        updateData
      );

      return payment as unknown as AppwritePayment;
    } catch (error) {
      console.error('Error updating payment:', error);
      throw new Error('Failed to update payment record');
    }
  }

  /**
   * Delete payment
   */
  static async delete(id: string): Promise<void> {
    try {
      await databases.deleteDocument(this.databaseId, this.collectionId, id);
    } catch (error) {
      console.error('Error deleting payment:', error);
      throw new Error('Failed to delete payment record');
    }
  }

  /**
   * Get payments for a specific company
   */
  static async findByCompany(
    companyId: string,
    limit: number = 50
  ): Promise<AppwritePayment[]> {
    return await this.findMany({ companyId, limit });
  }

  /**
   * Get recent payments across all companies
   */
  static async findRecent(
    days: number = 30,
    limit: number = 50
  ): Promise<AppwritePayment[]> {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    return await this.findMany({
      paymentDateFrom: fromDate,
      limit,
    });
  }
}
