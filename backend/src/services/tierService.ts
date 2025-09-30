import { CompanyModel, AppwriteCompany } from '../models/AppwriteCompany';
import { UserModel } from '../models/AppwriteUser';
import { TierChangeLogModel, CreateTierChangeLogData } from '../models/AppwriteTierChangeLog';
import { NotificationService } from './notificationService';
import { COMPANY_TIERS, TIER_CHANGE_REASONS, USER_ROLES, NOTIFICATION_TYPES, type CompanyTier, type TierChangeReason } from '../config/appwrite';

export interface TierChangeLog {
  $id: string;
  companyId: string;
  oldTier: CompanyTier;
  newTier: CompanyTier;
  reason: TierChangeReason;
  changedBy?: string; // User ID for manual changes
  createdAt: string;
}

export interface TierUpdateResult {
  totalCompanies: number;
  updatedCount: number;
  changes: Array<{
    companyId: string;
    companyName: string;
    oldTier: CompanyTier;
    newTier: CompanyTier;
  }>;
}

export class TierService {
  /**
   * Update all company tiers and log changes
   */
  async updateAllTiers(): Promise<TierUpdateResult> {
    const companies = await CompanyModel.findMany();

    const changes: TierUpdateResult['changes'] = [];
    let updatedCount = 0;

    for (const company of companies) {
      const newTier = CompanyModel.calculateTier(
        new Date(company.startDate),
        company.adSpend
      );

      if (newTier !== company.tier) {
        // Update company tier
        await CompanyModel.update(company.$id, { tier: newTier });

        // Log the tier change
        await this.logTierChange({
          companyId: company.$id,
          oldTier: company.tier,
          newTier: newTier,
          reason: TIER_CHANGE_REASONS.AUTOMATIC
        });

        // Create notification for company owner
        await this.createTierChangeNotification(
          company.createdBy,
          company.$id,
          company.name,
          company.tier,
          newTier
        );

        changes.push({
          companyId: company.$id,
          companyName: company.name,
          oldTier: company.tier,
          newTier: newTier
        });

        updatedCount++;
      }
    }

    return {
      totalCompanies: companies.length,
      updatedCount,
      changes
    };
  }

  /**
   * Manually override a company's tier (admin only)
   */
  async overrideTier(
    companyId: string,
    newTier: CompanyTier,
    adminUserId: string,
    reason?: string
  ): Promise<void> {
    // Verify admin permissions
    const admin = await UserModel.findById(adminUserId);

    if (!admin || (admin.role !== USER_ROLES.CEO && admin.role !== USER_ROLES.MANAGER)) {
      throw new Error('Insufficient permissions to override tier');
    }

    // Get current company data
    const company = await CompanyModel.findById(companyId);

    if (!company) {
      throw new Error('Company not found');
    }

    if (company.tier === newTier) {
      throw new Error('Company is already in the specified tier');
    }

    // Update company tier
    await CompanyModel.update(companyId, { tier: newTier });

    // Log the manual tier change
    const logData: any = {
      companyId,
      oldTier: company.tier,
      newTier,
      reason: TIER_CHANGE_REASONS.MANUAL_OVERRIDE,
      changedBy: adminUserId,
    };
    
    if (reason) {
      logData.notes = reason;
    }
    
    await this.logTierChange(logData);

    // Create notification for company owner (if different from admin)
    if (company.createdBy !== adminUserId) {
      await this.createTierChangeNotification(
        company.createdBy,
        companyId,
        company.name,
        company.tier,
        newTier,
        `Tier manually updated by ${admin.username}`
      );
    }

    // Create notification for admin confirming the change
    await NotificationService.createNotification({
      userId: adminUserId,
      type: NOTIFICATION_TYPES.COMPANY_MILESTONE,
      title: 'Tier Override Completed',
      message: `Successfully updated ${company.name} from ${company.tier} to ${newTier}`,
      scheduledFor: new Date(),
      relatedCompanyId: companyId
    });
  }

  /**
   * Get tier change history for a company
   */
  async getTierHistory(companyId: string): Promise<any[]> {
    const logs = await TierChangeLogModel.findByCompanyId(companyId);
    
    // Enhance with user information for manual changes
    const enhancedLogs = await Promise.all(
      logs.map(async (log) => {
        let changedByUser: any = null;
        if (log.changedBy) {
          changedByUser = await UserModel.findById(log.changedBy);
        }
        
        return {
          ...log,
          changedByUser: changedByUser ? {
            $id: changedByUser.$id,
            username: changedByUser.username
          } : null
        };
      })
    );

    return enhancedLogs;
  }

  /**
   * Get tier statistics
   */
  async getTierStatistics(): Promise<{
    distribution: Record<CompanyTier, number>;
    recentChanges: number;
    totalCompanies: number;
  }> {
    // Get all companies to calculate distribution
    const companies = await CompanyModel.findMany({}, 1000); // Adjust limit as needed

    // Calculate tier distribution
    const distribution = companies.reduce((acc, company) => {
      acc[company.tier] = (acc[company.tier] || 0) + 1;
      return acc;
    }, {} as Record<CompanyTier, number>);

    // Ensure all tiers are represented
    const fullDistribution: Record<CompanyTier, number> = {
      [COMPANY_TIERS.TIER_1]: distribution[COMPANY_TIERS.TIER_1] || 0,
      [COMPANY_TIERS.TIER_2]: distribution[COMPANY_TIERS.TIER_2] || 0,
      [COMPANY_TIERS.TIER_3]: distribution[COMPANY_TIERS.TIER_3] || 0
    };

    // Get recent changes (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentChanges = await TierChangeLogModel.count({
      dateFrom: sevenDaysAgo
    });

    return {
      distribution: fullDistribution,
      recentChanges,
      totalCompanies: companies.length
    };
  }

  /**
   * Log a tier change
   */
  private async logTierChange(data: {
    companyId: string;
    oldTier: CompanyTier;
    newTier: CompanyTier;
    reason: TierChangeReason;
    changedBy?: string;
    notes?: string;
  }): Promise<void> {
    const logData: any = {
      companyId: data.companyId,
      oldTier: data.oldTier,
      newTier: data.newTier,
      reason: data.reason,
    };
    
    if (data.changedBy) {
      logData.changedBy = data.changedBy;
    }
    
    if (data.notes) {
      logData.notes = data.notes;
    }
    
    await TierChangeLogModel.create(logData);
  }

  /**
   * Create a tier change notification
   */
  private async createTierChangeNotification(
    userId: string,
    companyId: string,
    companyName: string,
    oldTier: CompanyTier,
    newTier: CompanyTier,
    customMessage?: string
  ): Promise<void> {
    const tierLabels = {
      [COMPANY_TIERS.TIER_1]: 'Tier 1 (High Ad Spend & Established)',
      [COMPANY_TIERS.TIER_2]: 'Tier 2 (New Company)',
      [COMPANY_TIERS.TIER_3]: 'Tier 3 (Low Ad Spend & Established)'
    };

    const message = customMessage || 
      `${companyName} has been moved from ${tierLabels[oldTier]} to ${tierLabels[newTier]}`;

    await NotificationService.createNotification({
      userId,
      type: NOTIFICATION_TYPES.COMPANY_MILESTONE,
      title: 'Company Tier Updated',
      message,
      scheduledFor: new Date(),
      relatedCompanyId: companyId
    });
  }

  /**
   * Check if a user can override tiers
   */
  async canOverrideTiers(userId: string): Promise<boolean> {
    const user = await UserModel.findById(userId);
    return user?.role === USER_ROLES.CEO || user?.role === USER_ROLES.MANAGER;
  }

  /**
   * Get companies that might need tier review
   */
  async getCompaniesNeedingReview(): Promise<Array<{
    $id: string;
    name: string;
    tier: CompanyTier;
    suggestedTier: CompanyTier;
    reason: string;
  }>> {
    const companies = await CompanyModel.findMany();

    const needsReview: Array<{
      $id: string;
      name: string;
      tier: CompanyTier;
      suggestedTier: CompanyTier;
      reason: string;
    }> = [];

    for (const company of companies) {
      const suggestedTier = CompanyModel.calculateTier(
        new Date(company.startDate),
        company.adSpend
      );

      if (suggestedTier !== company.tier) {
        let reason = '';
        if (suggestedTier === COMPANY_TIERS.TIER_1) {
          reason = 'High ad spend (>$2500) and established (>3 months) qualifies for Tier 1';
        } else if (suggestedTier === COMPANY_TIERS.TIER_2) {
          reason = 'Company is still new (<3 months)';
        } else {
          reason = 'Company is established (>3 months) with low ad spend (≤$2500)';
        }

        needsReview.push({
          $id: company.$id,
          name: company.name,
          tier: company.tier,
          suggestedTier,
          reason
        });
      }
    }

    return needsReview;
  }

  /**
   * Get tier change logs with pagination
   */
  async getTierChangeLogs(
    filters: {
      companyId?: string;
      reason?: TierChangeReason;
      changedBy?: string;
      dateFrom?: Date;
      dateTo?: Date;
    } = {},
    limit: number = 50,
    offset: number = 0
  ): Promise<any[]> {
    const logs = await TierChangeLogModel.findMany(filters, limit, offset);
    
    // Enhance with user and company information
    const enhancedLogs = await Promise.all(
      logs.map(async (log) => {
        const [company, changedByUser] = await Promise.all([
          CompanyModel.findById(log.companyId),
          log.changedBy ? UserModel.findById(log.changedBy) : null
        ]);
        
        return {
          ...log,
          company: company ? {
            $id: company.$id,
            name: company.name
          } : null,
          changedByUser: changedByUser ? {
            $id: changedByUser.$id,
            username: changedByUser.username
          } : null
        };
      })
    );

    return enhancedLogs;
  }
}