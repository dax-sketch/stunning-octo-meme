import { databases, COLLECTIONS, generateId, COMPANY_TIERS, type CompanyTier } from '../config/appwrite';
import { Query } from 'appwrite';

export interface AppwriteCompany {
  $id: string;
  name: string;
  startDate: string;
  phoneNumber: string;
  email: string;
  website?: string;
  tier: CompanyTier;
  adSpend: number;
  lastPaymentDate?: string;
  lastPaymentAmount?: number;
  lastMeetingDate?: string;
  lastMeetingAttendees: string; // JSON string array
  lastMeetingDuration?: number;
  createdBy: string;
  $createdAt: string;
  $updatedAt: string;
}

export interface CreateCompanyData {
  name: string;
  startDate: Date;
  phoneNumber: string;
  email: string;
  website?: string;
  tier?: CompanyTier;
  adSpend?: number;
  createdBy: string;
}

export interface UpdateCompanyData {
  name?: string;
  startDate?: Date;
  phoneNumber?: string;
  email?: string;
  website?: string;
  tier?: CompanyTier;
  adSpend?: number;
  lastPaymentDate?: Date;
  lastPaymentAmount?: number;
  lastMeetingDate?: Date;
  lastMeetingAttendees?: string[];
  lastMeetingDuration?: number;
}

export interface CompanyFilters {
  tier?: CompanyTier;
  search?: string;
  createdBy?: string;
  startDateFrom?: Date;
  startDateTo?: Date;
}

export class CompanyModel {
  private static databaseId = process.env.APPWRITE_DATABASE_ID || 'client-management';
  private static collectionId = COLLECTIONS.COMPANIES;

  /**
   * Create a new company
   */
  static async create(data: CreateCompanyData): Promise<AppwriteCompany> {
    const companyData = {
      name: data.name,
      startDate: data.startDate.toISOString(),
      phoneNumber: data.phoneNumber,
      email: data.email,
      website: data.website || null,
      tier: data.tier || COMPANY_TIERS.TIER_2,
      adSpend: data.adSpend || 0,
      lastMeetingAttendees: '[]', // Empty JSON array
      createdBy: data.createdBy,

    };

    return await databases.createDocument(
      this.databaseId,
      this.collectionId,
      generateId(),
      companyData
    ) as unknown as AppwriteCompany;
  }

  /**
   * Find company by ID
   */
  static async findById(id: string): Promise<AppwriteCompany | null> {
    try {
      return await databases.getDocument(
        this.databaseId,
        this.collectionId,
        id
      ) as unknown as AppwriteCompany;
    } catch (error: any) {
      if (error.code === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Update company by ID
   */
  static async update(id: string, data: UpdateCompanyData): Promise<AppwriteCompany> {
    const updateData: any = {};

    if (data.name) updateData.name = data.name;
    if (data.startDate) updateData.startDate = data.startDate.toISOString();
    if (data.phoneNumber) updateData.phoneNumber = data.phoneNumber;
    if (data.email) updateData.email = data.email;
    if (data.website !== undefined) updateData.website = data.website;
    if (data.tier) updateData.tier = data.tier;
    if (data.adSpend !== undefined) updateData.adSpend = data.adSpend;
    if (data.lastPaymentDate) updateData.lastPaymentDate = data.lastPaymentDate.toISOString();
    if (data.lastPaymentAmount !== undefined) updateData.lastPaymentAmount = data.lastPaymentAmount;
    if (data.lastMeetingDate) updateData.lastMeetingDate = data.lastMeetingDate.toISOString();
    if (data.lastMeetingAttendees) updateData.lastMeetingAttendees = JSON.stringify(data.lastMeetingAttendees);
    if (data.lastMeetingDuration !== undefined) updateData.lastMeetingDuration = data.lastMeetingDuration;

    return await databases.updateDocument(
      this.databaseId,
      this.collectionId,
      id,
      updateData
    ) as unknown as AppwriteCompany;
  }

  /**
   * Delete company by ID
   */
  static async delete(id: string): Promise<void> {
    await databases.deleteDocument(
      this.databaseId,
      this.collectionId,
      id
    );
  }

  /**
   * Find companies with pagination and filters
   */
  static async findMany(filters: CompanyFilters = {}, limit: number = 50, offset: number = 0): Promise<AppwriteCompany[]> {
    const queries = [];
    
    if (filters.createdBy) {
      queries.push(Query.equal('createdBy', filters.createdBy));
    }
    
    if (filters.tier) {
      queries.push(Query.equal('tier', filters.tier));
    }
    
    if (filters.search) {
      queries.push(Query.search('name', filters.search));
    }
    
    if (filters.startDateFrom) {
      queries.push(Query.greaterThanEqual('startDate', filters.startDateFrom.toISOString()));
    }
    
    if (filters.startDateTo) {
      queries.push(Query.lessThanEqual('startDate', filters.startDateTo.toISOString()));
    }
    
    queries.push(Query.limit(limit));
    queries.push(Query.offset(offset));
    queries.push(Query.orderDesc('$createdAt'));

    const response = await databases.listDocuments(
      this.databaseId,
      this.collectionId,
      queries
    );

    return response.documents as unknown as AppwriteCompany[];
  }

  /**
   * Count companies with filters
   */
  static async count(filters: CompanyFilters = {}): Promise<number> {
    const queries = [];
    
    if (filters.createdBy) {
      queries.push(Query.equal('createdBy', filters.createdBy));
    }
    
    if (filters.tier) {
      queries.push(Query.equal('tier', filters.tier));
    }
    
    if (filters.search) {
      queries.push(Query.search('name', filters.search));
    }
    
    if (filters.startDateFrom) {
      queries.push(Query.greaterThanEqual('startDate', filters.startDateFrom.toISOString()));
    }
    
    if (filters.startDateTo) {
      queries.push(Query.lessThanEqual('startDate', filters.startDateTo.toISOString()));
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
   * Find companies by tier
   */
  static async findByTier(tier: CompanyTier): Promise<AppwriteCompany[]> {
    const response = await databases.listDocuments(
      this.databaseId,
      this.collectionId,
      [
        Query.equal('tier', tier),
        Query.orderDesc('$createdAt')
      ]
    );

    return response.documents as unknown as AppwriteCompany[];
  }

  /**
   * Calculate tier based on company age and weekly ad spend
   * - Tier 1: Weekly Ad Spend > $2500 AND older than 3 months
   * - Tier 2: Younger than 3 months (regardless of weekly ad spend)
   * - Tier 3: Older than 3 months AND weekly ad spend ≤ $2500
   */
  static calculateTier(startDate: Date, adSpend: number): CompanyTier {
    const now = new Date();
    const ageInMonths = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30);

    // Tier 2: New companies (< 3 months) regardless of weekly ad spend
    if (ageInMonths < 3) {
      return COMPANY_TIERS.TIER_2;
    }

    // For companies older than 3 months, tier depends on weekly ad spend
    // Tier 1: High weekly ad spend (> $2500) and older than 3 months
    if (adSpend > 2500) {
      return COMPANY_TIERS.TIER_1;
    }

    // Tier 3: Low weekly ad spend (≤ $2500) and older than 3 months
    return COMPANY_TIERS.TIER_3;
  }

  /**
   * Update all company tiers based on current rules
   */
  static async updateAllTiers(): Promise<number> {
    // Get all companies
    const response = await databases.listDocuments(
      this.databaseId,
      this.collectionId,
      [Query.limit(1000)] // Adjust limit as needed
    );

    const companies = response.documents as unknown as AppwriteCompany[];
    let updatedCount = 0;

    for (const company of companies) {
      const startDate = new Date(company.startDate);
      const expectedTier = this.calculateTier(startDate, company.adSpend);
      
      if (company.tier !== expectedTier) {
        await this.update(company.$id, { tier: expectedTier });
        updatedCount++;
      }
    }

    return updatedCount;
  }

  /**
   * Search companies by name or email
   */
  static async search(query: string, limit: number = 50): Promise<AppwriteCompany[]> {
    const response = await databases.listDocuments(
      this.databaseId,
      this.collectionId,
      [
        Query.search('name', query),
        Query.limit(limit),
        Query.orderDesc('$createdAt')
      ]
    );

    return response.documents as unknown as AppwriteCompany[];
  }
}