import { databases, COLLECTIONS, generateId, AUDIT_STATUS, type AuditStatus } from '../config/appwrite';
import { Query } from 'appwrite';

export interface AppwriteAudit {
  $id: string;
  companyId: string;
  scheduledDate: string;
  completedDate?: string;
  assignedTo: string;
  status: AuditStatus;
  notes?: string;
  $createdAt: string;
  $updatedAt: string;
}

export interface CreateAuditData {
  companyId: string;
  scheduledDate: Date;
  assignedTo: string;
  notes?: string;
}

export interface UpdateAuditData {
  scheduledDate?: Date;
  completedDate?: Date;
  assignedTo?: string;
  status?: AuditStatus;
  notes?: string;
}

export interface AuditFilters {
  companyId?: string;
  assignedTo?: string;
  status?: AuditStatus;
  scheduledDateFrom?: Date;
  scheduledDateTo?: Date;
}

export class AuditModel {
  private static databaseId = process.env.APPWRITE_DATABASE_ID || 'client-management';
  private static collectionId = COLLECTIONS.AUDITS;

  /**
   * Create a new audit
   */
  static async create(data: CreateAuditData): Promise<AppwriteAudit> {
    const auditData = {
      companyId: data.companyId,
      scheduledDate: data.scheduledDate.toISOString(),
      assignedTo: data.assignedTo,
      status: AUDIT_STATUS.SCHEDULED,
      notes: data.notes || null,
    };

    return await databases.createDocument(
      this.databaseId,
      this.collectionId,
      generateId(),
      auditData
    ) as unknown as AppwriteAudit;
  }

  /**
   * Find audit by ID
   */
  static async findById(id: string): Promise<AppwriteAudit | null> {
    try {
      return await databases.getDocument(
        this.databaseId,
        this.collectionId,
        id
      ) as unknown as AppwriteAudit;
    } catch (error: any) {
      if (error.code === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Update audit by ID
   */
  static async update(id: string, data: UpdateAuditData): Promise<AppwriteAudit> {
    const updateData: any = {};

    if (data.scheduledDate) updateData.scheduledDate = data.scheduledDate.toISOString();
    if (data.completedDate) updateData.completedDate = data.completedDate.toISOString();
    if (data.assignedTo) updateData.assignedTo = data.assignedTo;
    if (data.status) updateData.status = data.status;
    if (data.notes !== undefined) updateData.notes = data.notes;

    return await databases.updateDocument(
      this.databaseId,
      this.collectionId,
      id,
      updateData
    ) as unknown as AppwriteAudit;
  }

  /**
   * Delete audit by ID
   */
  static async delete(id: string): Promise<boolean> {
    try {
      await databases.deleteDocument(
        this.databaseId,
        this.collectionId,
        id
      );
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Find audits with filters
   */
  static async findMany(filters: AuditFilters = {}, limit: number = 50, offset: number = 0): Promise<AppwriteAudit[]> {
    const queries = [];

    if (filters.companyId) {
      queries.push(Query.equal('companyId', filters.companyId));
    }

    if (filters.assignedTo) {
      queries.push(Query.equal('assignedTo', filters.assignedTo));
    }

    if (filters.status) {
      queries.push(Query.equal('status', filters.status));
    }

    if (filters.scheduledDateFrom) {
      queries.push(Query.greaterThanEqual('scheduledDate', filters.scheduledDateFrom.toISOString()));
    }

    if (filters.scheduledDateTo) {
      queries.push(Query.lessThanEqual('scheduledDate', filters.scheduledDateTo.toISOString()));
    }

    queries.push(Query.limit(limit));
    queries.push(Query.offset(offset));
    queries.push(Query.orderDesc('scheduledDate'));

    const response = await databases.listDocuments(
      this.databaseId,
      this.collectionId,
      queries
    );

    return response.documents as unknown as AppwriteAudit[];
  }

  /**
   * Find audits by company ID
   */
  static async findByCompanyId(companyId: string): Promise<AppwriteAudit[]> {
    const response = await databases.listDocuments(
      this.databaseId,
      this.collectionId,
      [
        Query.equal('companyId', companyId),
        Query.orderDesc('scheduledDate')
      ]
    );

    return response.documents as unknown as AppwriteAudit[];
  }

  /**
   * Mark audit as completed
   */
  static async markCompleted(id: string, notes?: string): Promise<AppwriteAudit | null> {
    try {
      const updateData: any = {
        status: AUDIT_STATUS.COMPLETED,
        completedDate: new Date().toISOString(),
      };

      if (notes) {
        updateData.notes = notes;
      }

      return await databases.updateDocument(
        this.databaseId,
        this.collectionId,
        id,
        updateData
      ) as unknown as AppwriteAudit;
    } catch (error) {
      return null;
    }
  }

  /**
   * Find overdue audits
   */
  static async findOverdue(): Promise<AppwriteAudit[]> {
    const now = new Date().toISOString();

    const response = await databases.listDocuments(
      this.databaseId,
      this.collectionId,
      [
        Query.equal('status', AUDIT_STATUS.SCHEDULED),
        Query.lessThan('scheduledDate', now),
        Query.orderAsc('scheduledDate')
      ]
    );

    return response.documents as unknown as AppwriteAudit[];
  }

  /**
   * Mark overdue audits
   */
  static async markOverdueAudits(): Promise<number> {
    const overdueAudits = await this.findOverdue();
    let count = 0;

    for (const audit of overdueAudits) {
      try {
        await this.update(audit.$id, { status: AUDIT_STATUS.OVERDUE });
        count++;
      } catch (error) {
        console.error(`Failed to mark audit ${audit.$id} as overdue:`, error);
      }
    }

    return count;
  }

  /**
   * Find upcoming audits
   */
  static async findUpcoming(days: number = 7): Promise<AppwriteAudit[]> {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + days);

    const response = await databases.listDocuments(
      this.databaseId,
      this.collectionId,
      [
        Query.equal('status', AUDIT_STATUS.SCHEDULED),
        Query.greaterThanEqual('scheduledDate', now.toISOString()),
        Query.lessThanEqual('scheduledDate', futureDate.toISOString()),
        Query.orderAsc('scheduledDate')
      ]
    );

    return response.documents as unknown as AppwriteAudit[];
  }
}