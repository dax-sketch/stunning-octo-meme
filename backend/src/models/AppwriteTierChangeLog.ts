import { databases, COLLECTIONS, generateId, COMPANY_TIERS, TIER_CHANGE_REASONS, type CompanyTier, type TierChangeReason } from '../config/appwrite';
import { Query } from 'appwrite';

export interface AppwriteTierChangeLog {
  $id: string;
  companyId: string;
  oldTier: CompanyTier;
  newTier: CompanyTier;
  reason: TierChangeReason;
  changedBy?: string; // User ID for manual changes
  notes?: string;
  $createdAt: string;
}

export interface CreateTierChangeLogData {
  companyId: string;
  oldTier: CompanyTier;
  newTier: CompanyTier;
  reason: TierChangeReason;
  changedBy?: string;
  notes?: string;
}

export interface TierChangeLogFilters {
  companyId?: string;
  reason?: TierChangeReason;
  changedBy?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export class TierChangeLogModel {
  private static databaseId = process.env.APPWRITE_DATABASE_ID || 'client-management';
  private static collectionId = COLLECTIONS.TIER_CHANGE_LOGS;

  /**
   * Create a new tier change log entry
   */
  static async create(data: CreateTierChangeLogData): Promise<AppwriteTierChangeLog> {
    const logData = {
      companyId: data.companyId,
      oldTier: data.oldTier,
      newTier: data.newTier,
      reason: data.reason,
      changedBy: data.changedBy || null,
      notes: data.notes || null,

    };

    return await databases.createDocument(
      this.databaseId,
      this.collectionId,
      generateId(),
      logData
    ) as unknown as AppwriteTierChangeLog;
  }

  /**
   * Find tier change log by ID
   */
  static async findById(id: string): Promise<AppwriteTierChangeLog | null> {
    try {
      return await databases.getDocument(
        this.databaseId,
        this.collectionId,
        id
      ) as unknown as AppwriteTierChangeLog;
    } catch (error: any) {
      if (error.code === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Find tier change logs with filters
   */
  static async findMany(filters: TierChangeLogFilters = {}, limit: number = 50, offset: number = 0): Promise<AppwriteTierChangeLog[]> {
    const queries = [];
    
    if (filters.companyId) {
      queries.push(Query.equal('companyId', filters.companyId));
    }
    
    if (filters.reason) {
      queries.push(Query.equal('reason', filters.reason));
    }
    
    if (filters.changedBy) {
      queries.push(Query.equal('changedBy', filters.changedBy));
    }
    
    if (filters.dateFrom) {
      queries.push(Query.greaterThanEqual('$createdAt', filters.dateFrom.toISOString()));
    }
    
    if (filters.dateTo) {
      queries.push(Query.lessThanEqual('$createdAt', filters.dateTo.toISOString()));
    }
    
    queries.push(Query.limit(limit));
    queries.push(Query.offset(offset));
    queries.push(Query.orderDesc('$createdAt'));

    const response = await databases.listDocuments(
      this.databaseId,
      this.collectionId,
      queries
    );

    return response.documents as unknown as AppwriteTierChangeLog[];
  }

  /**
   * Get tier change history for a company
   */
  static async findByCompanyId(companyId: string): Promise<AppwriteTierChangeLog[]> {
    const response = await databases.listDocuments(
      this.databaseId,
      this.collectionId,
      [
        Query.equal('companyId', companyId),
        Query.orderDesc('$createdAt')
      ]
    );

    return response.documents as unknown as AppwriteTierChangeLog[];
  }

  /**
   * Get recent tier changes
   */
  static async getRecentChanges(days: number = 7): Promise<AppwriteTierChangeLog[]> {
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);

    return await this.findMany({ dateFrom });
  }

  /**
   * Count tier changes with filters
   */
  static async count(filters: TierChangeLogFilters = {}): Promise<number> {
    const queries = [];
    
    if (filters.companyId) {
      queries.push(Query.equal('companyId', filters.companyId));
    }
    
    if (filters.reason) {
      queries.push(Query.equal('reason', filters.reason));
    }
    
    if (filters.changedBy) {
      queries.push(Query.equal('changedBy', filters.changedBy));
    }
    
    if (filters.dateFrom) {
      queries.push(Query.greaterThanEqual('$createdAt', filters.dateFrom.toISOString()));
    }
    
    if (filters.dateTo) {
      queries.push(Query.lessThanEqual('$createdAt', filters.dateTo.toISOString()));
    }
    
    queries.push(Query.limit(1)); // We only need the count

    const response = await databases.listDocuments(
      this.databaseId,
      this.collectionId,
      queries
    );

    return response.total;
  }

  /**
   * Delete tier change log by ID
   */
  static async delete(id: string): Promise<void> {
    await databases.deleteDocument(
      this.databaseId,
      this.collectionId,
      id
    );
  }
}