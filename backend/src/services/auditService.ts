import {
  AuditModel,
  CreateAuditData,
  UpdateAuditData,
  AuditFilters,
  AppwriteAudit,
} from '../models/AppwriteAudit';
import { CompanyModel } from '../models/AppwriteCompany';
import { UserModel } from '../models/AppwriteUser';
import { NotificationModel } from '../models/AppwriteNotification';
import { AUDIT_STATUS, NOTIFICATION_TYPES } from '../config/appwrite';

export interface AuditScheduleConfig {
  companyId: string;
  assignedTo: string;
}

export class AuditService {
  constructor() {
    // NotificationModel methods are static, no need for instance
  }

  /**
   * Create a new audit
   */
  async createAudit(data: CreateAuditData): Promise<AppwriteAudit> {
    // Validate that company and assignee exist
    const company = await CompanyModel.findById(data.companyId);
    if (!company) {
      throw new Error('Company not found');
    }

    const audit = await AuditModel.create(data);

    // Schedule notification for the audit - DISABLED FOR NOW
    // await this.scheduleAuditNotification(audit);

    return audit;
  }

  /**
   * Get audit by ID
   */
  async getAuditById(id: string): Promise<any | null> {
    const audit = await AuditModel.findById(id);
    if (!audit) return null;

    // Populate company name
    const company = await CompanyModel.findById(audit.companyId);
    
    // Return null if company no longer exists
    if (!company) return null;
    
    return {
      id: audit.$id,
      companyId: audit.companyId,
      companyName: company.name,
      scheduledDate: audit.scheduledDate,
      completedDate: audit.completedDate,
      assignedTo: audit.assignedTo,
      status: audit.status,
      notes: audit.notes,
      createdAt: audit.$createdAt,
      updatedAt: audit.$updatedAt,
    };
  }

  /**
   * Get all audits with filtering
   */
  async getAudits(filters: AuditFilters = {}): Promise<any[]> {
    const audits = await AuditModel.findMany(filters);

    // Populate company names
    const auditsWithCompanyNames = await Promise.all(
      audits.map(async (audit) => {
        const company = await CompanyModel.findById(audit.companyId);
        return {
          id: audit.$id,
          companyId: audit.companyId,
          companyName: company?.name || 'Unknown Company',
          scheduledDate: audit.scheduledDate,
          completedDate: audit.completedDate,
          assignedTo: audit.assignedTo,
          status: audit.status,
          notes: audit.notes,
          createdAt: audit.$createdAt,
          updatedAt: audit.$updatedAt,
        };
      })
    );

    // Filter out audits where company no longer exists
    return auditsWithCompanyNames.filter(audit => audit.companyName !== 'Unknown Company');
  }

  /**
   * Update audit
   */
  async updateAudit(
    id: string,
    data: UpdateAuditData
  ): Promise<AppwriteAudit | null> {
    const existingAudit = await AuditModel.findById(id);
    if (!existingAudit) {
      throw new Error('Audit not found');
    }

    const updatedAudit = await AuditModel.update(id, data);

    // If scheduled date changed, update notification - DISABLED FOR NOW
    // if (data.scheduledDate && updatedAudit) {
    //   await this.scheduleAuditNotification(updatedAudit);
    // }

    return updatedAudit;
  }

  /**
   * Delete audit
   */
  async deleteAudit(id: string): Promise<boolean> {
    return await AuditModel.delete(id);
  }

  /**
   * Get audits for a specific company
   */
  async getAuditsByCompany(companyId: string): Promise<AppwriteAudit[]> {
    return await AuditModel.findByCompanyId(companyId);
  }

  /**
   * Mark audit as completed
   */
  async completeAudit(
    id: string,
    notes?: string
  ): Promise<AppwriteAudit | null> {
    const audit = await AuditModel.markCompleted(id, notes);

    if (audit) {
      // Schedule next audit for the company
      await this.scheduleNextAudit(audit.companyId, audit.assignedTo);
    }

    return audit;
  }

  /**
   * Calculate next audit date based on company tier
   * All audits are scheduled on Wednesdays
   * Tier 1 (High Weekly Ad Spend): Every 3 months
   * Tier 2 (New Companies): Every week
   * Tier 3 (Low Weekly Ad Spend): Every month
   */
  calculateNextAuditDate(
    companyTier: 'TIER_1' | 'TIER_2' | 'TIER_3',
    currentDate: Date = new Date()
  ): Date {
    let nextAuditDate = new Date(currentDate);

    switch (companyTier) {
      case 'TIER_2':
        // Weekly audits for Tier 2 (New Companies)
        nextAuditDate.setDate(currentDate.getDate() + 7);
        break;
      case 'TIER_3':
        // Monthly audits for Tier 3 (Low Weekly Ad Spend)
        nextAuditDate.setMonth(currentDate.getMonth() + 1);
        break;
      case 'TIER_1':
      default:
        // Quarterly audits for Tier 1 (High Weekly Ad Spend)
        nextAuditDate.setMonth(currentDate.getMonth() + 3);
        break;
    }

    // Ensure the audit is scheduled on a Wednesday (day 3, where Sunday = 0)
    nextAuditDate = this.getNextWednesday(nextAuditDate);

    return nextAuditDate;
  }

  /**
   * Get the next Wednesday from the given date
   * If the given date is already a Wednesday, return it
   */
  private getNextWednesday(date: Date): Date {
    const result = new Date(date);
    const dayOfWeek = result.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const wednesday = 3; // Wednesday is day 3

    if (dayOfWeek === wednesday) {
      // If it's already Wednesday, return the same date
      return result;
    } else if (dayOfWeek < wednesday) {
      // If it's before Wednesday in the same week, move to Wednesday
      result.setDate(result.getDate() + (wednesday - dayOfWeek));
    } else {
      // If it's after Wednesday, move to next Wednesday
      result.setDate(result.getDate() + (7 - dayOfWeek + wednesday));
    }

    return result;
  }

  /**
   * Get company age in months
   */
  private getCompanyAgeInMonths(
    startDate: Date,
    currentDate: Date = new Date()
  ): number {
    const yearDiff = currentDate.getFullYear() - startDate.getFullYear();
    const monthDiff = currentDate.getMonth() - startDate.getMonth();
    return yearDiff * 12 + monthDiff;
  }

  /**
   * Schedule initial audits for a new company
   */
  async scheduleInitialAudits(
    config: AuditScheduleConfig
  ): Promise<AppwriteAudit[]> {
    const company = await CompanyModel.findById(config.companyId);
    if (!company) {
      throw new Error('Company not found');
    }

    const audits: AppwriteAudit[] = [];
    const currentDate = new Date();

    // Schedule first audit based on company tier
    const firstAuditDate = this.calculateNextAuditDate(
      company.tier,
      currentDate
    );

    const firstAudit = await this.createAudit({
      companyId: config.companyId,
      scheduledDate: firstAuditDate,
      assignedTo: config.assignedTo,
      notes: `Initial audit scheduled for Wednesday based on company tier (${company.tier})`,
    });

    audits.push(firstAudit);

    return audits;
  }

  /**
   * Schedule next audit for a company after completion
   */
  async scheduleNextAudit(
    companyId: string,
    assignedTo: string
  ): Promise<AppwriteAudit> {
    const company = await CompanyModel.findById(companyId);
    if (!company) {
      throw new Error('Company not found');
    }

    const nextAuditDate = this.calculateNextAuditDate(company.tier);

    return await this.createAudit({
      companyId,
      scheduledDate: nextAuditDate,
      assignedTo,
      notes: `Automatically scheduled for Wednesday after previous audit completion (${company.tier})`,
    });
  }

  /**
   * Update audit schedules for all companies based on their current tier
   * Automatically creates audits for companies that don't have any scheduled
   */
  async updateAuditSchedulesForAllCompanies(): Promise<{
    updated: number;
    created: number;
  }> {
    const companies = await CompanyModel.findMany();
    let updatedCount = 0;
    let createdCount = 0;

    for (const company of companies) {
      try {
        // Get existing scheduled audits for this company
        const existingAudits = await AuditModel.findMany({
          companyId: company.$id,
          status: AUDIT_STATUS.SCHEDULED,
        });

        // Calculate what the next audit date should be based on current company tier
        const expectedNextAuditDate = this.calculateNextAuditDate(company.tier);

        // If no scheduled audits exist, create one
        if (existingAudits.length === 0) {
          // Find a suitable assignee (prefer CEO, then Manager, then any user)
          const assignedTo = await this.findSuitableAssignee(company.createdBy);

          await this.createAudit({
            companyId: company.$id,
            scheduledDate: expectedNextAuditDate,
            assignedTo,
            notes: `Automatically scheduled for Wednesday based on company tier (${company.tier})`,
          });
          createdCount++;
          console.log(
            `Created audit for company ${company.name} (${company.tier})`
          );
        } else {
          // Check if existing audit schedule needs updating based on tier changes
          const nextScheduledAudit = existingAudits[0];
          if (nextScheduledAudit) {
            const shouldReschedule = this.shouldRescheduleBasedOnTier(
              company.tier,
              new Date(nextScheduledAudit.scheduledDate)
            );

            if (shouldReschedule) {
              await AuditModel.update(nextScheduledAudit.$id, {
                scheduledDate: expectedNextAuditDate,
                notes: `Rescheduled for Wednesday due to tier-based schedule (${company.tier})`,
              });
              updatedCount++;
              console.log(
                `Updated audit schedule for company ${company.name} (${company.tier})`
              );
            }
          }
        }
      } catch (error) {
        console.error(
          `Error updating audit schedule for company ${company.$id}:`,
          error
        );
      }
    }

    return { updated: updatedCount, created: createdCount };
  }

  /**
   * Find a suitable assignee for an audit
   */
  private async findSuitableAssignee(defaultUserId: string): Promise<string> {
    try {
      // First try to use the default user
      const defaultUser = await UserModel.findById(defaultUserId);
      if (defaultUser) {
        return defaultUserId;
      }

      // Try to find a CEO
      const ceos = await UserModel.findByRole('CEO');
      if (ceos.length > 0) {
        return ceos[0]!.$id;
      }

      // Try to find a Manager
      const managers = await UserModel.findByRole('MANAGER');
      if (managers.length > 0) {
        return managers[0]!.$id;
      }

      // Fall back to any user
      const allUsers = await UserModel.findMany({ limit: 1 });
      if (allUsers.users.length > 0) {
        return allUsers.users[0]!.$id;
      }

      throw new Error('No suitable assignee found');
    } catch (error) {
      console.error('Error finding suitable assignee:', error);
      return defaultUserId; // Fall back to default even if it might not exist
    }
  }

  /**
   * Determine if an audit should be rescheduled based on company tier
   */
  private shouldRescheduleBasedOnTier(
    companyTier: 'TIER_1' | 'TIER_2' | 'TIER_3',
    currentScheduledDate: Date
  ): boolean {
    const expectedDate = this.calculateNextAuditDate(companyTier);
    const daysDifference = Math.abs(
      (expectedDate.getTime() - currentScheduledDate.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    // Reschedule if the difference is more than 3 days
    return daysDifference > 3;
  }

  /**
   * Get overdue audits and mark them as overdue
   */
  async processOverdueAudits(): Promise<{
    audits: AppwriteAudit[];
    markedCount: number;
  }> {
    const overdueAudits = await AuditModel.findOverdue();
    const markedCount = await AuditModel.markOverdueAudits();

    // Send notifications for overdue audits
    for (const audit of overdueAudits) {
      // Get company name for notification
      const company = await CompanyModel.findById(audit.companyId);
      const companyName = company?.name || 'Unknown Company';

      // DISABLED FOR NOW - Notification creation
      // await NotificationModel.create({
      //   userId: audit.assignedTo,
      //   type: NOTIFICATION_TYPES.AUDIT_DUE,
      //   title: 'Overdue Audit',
      //   message: `Audit for ${companyName} was due on ${new Date(audit.scheduledDate).toDateString()}`,
      //   relatedCompanyId: audit.companyId,
      //   scheduledFor: new Date(),
      // });
    }

    return { audits: overdueAudits, markedCount };
  }

  /**
   * Get upcoming audits
   */
  async getUpcomingAudits(days: number = 7): Promise<any[]> {
    console.log(`🔍 Getting upcoming audits for ${days} days...`);
    const audits = await AuditModel.findUpcoming(days);
    console.log(`📋 Found ${audits.length} raw upcoming audits`);

    // Populate company names and user information
    const auditsWithDetails = await Promise.all(
      audits.map(async (audit) => {
        const [company, assignedUser] = await Promise.all([
          CompanyModel.findById(audit.companyId),
          UserModel.findById(audit.assignedTo),
        ]);

        console.log(
          `📝 Processing audit for company ${audit.companyId}: ${company?.name || 'NOT FOUND'}`
        );

        return {
          id: audit.$id,
          companyId: audit.companyId,
          companyName: company?.name || 'Unknown Company',
          companyTier: company?.tier || 'TIER_3',
          scheduledDate: audit.scheduledDate,
          completedDate: audit.completedDate,
          assignedTo: audit.assignedTo,
          assignedToUsername: assignedUser?.username || 'Unknown User',
          status: audit.status,
          notes: audit.notes,
          createdAt: audit.$createdAt,
          updatedAt: audit.$updatedAt,
        };
      })
    );

    // Filter out audits where company no longer exists
    const filteredAudits = auditsWithDetails.filter(audit => audit.companyName !== 'Unknown Company');

    console.log(
      `✅ Returning ${filteredAudits.length} upcoming audits with valid companies (filtered out ${auditsWithDetails.length - filteredAudits.length} orphaned audits)`
    );
    return filteredAudits;
  }

  /**
   * Schedule audit notification - DISABLED FOR NOW
   */
  private async scheduleAuditNotification(audit: AppwriteAudit): Promise<void> {
    // DISABLED FOR NOW - Notification scheduling
    // // Schedule notification 1 day before audit
    // const notificationDate = new Date(audit.scheduledDate);
    // notificationDate.setDate(notificationDate.getDate() - 1);

    // // Get company name for notification
    // const company = await CompanyModel.findById(audit.companyId);
    // const companyName = company?.name || 'Unknown Company';

    // await NotificationModel.create({
    //   userId: audit.assignedTo,
    //   type: NOTIFICATION_TYPES.AUDIT_DUE,
    //   title: 'Upcoming Audit',
    //   message: `Audit for ${companyName} is scheduled for ${new Date(audit.scheduledDate).toDateString()}`,
    //   relatedCompanyId: audit.companyId,
    //   scheduledFor: notificationDate,
    // });
  }

  /**
   * Automatically schedule an audit for a newly created company
   */
  async scheduleAuditForNewCompany(
    companyId: string,
    createdBy: string
  ): Promise<AppwriteAudit> {
    const company = await CompanyModel.findById(companyId);
    if (!company) {
      throw new Error('Company not found');
    }

    // Calculate the first audit date based on tier (always on Wednesday)
    const firstAuditDate = this.calculateNextAuditDate(company.tier);

    // Find a suitable assignee
    const assignedTo = await this.findSuitableAssignee(createdBy);

    const audit = await this.createAudit({
      companyId,
      scheduledDate: firstAuditDate,
      assignedTo,
      notes: `Initial audit automatically scheduled for Wednesday for new company (${company.tier})`,
    });

    console.log(
      `Automatically scheduled audit for new company ${company.name} (${company.tier}) on ${firstAuditDate.toDateString()} (Wednesday)`
    );
    return audit;
  }

  /**
   * Get audit statistics
   */
  async getAuditStatistics(): Promise<{
    total: number;
    scheduled: number;
    completed: number;
    overdue: number;
    upcomingThisMonth: number;
  }> {
    const [allAudits, overdueAudits, upcomingAudits] = await Promise.all([
      AuditModel.findMany(),
      AuditModel.findOverdue(),
      AuditModel.findUpcoming(30), // Changed from 7 to 30 days
    ]);

    const scheduled = allAudits.filter(
      (audit) => audit.status === AUDIT_STATUS.SCHEDULED
    ).length;
    const completed = allAudits.filter(
      (audit) => audit.status === AUDIT_STATUS.COMPLETED
    ).length;

    return {
      total: allAudits.length,
      scheduled,
      completed,
      overdue: overdueAudits.length,
      upcomingThisMonth: upcomingAudits.length, // Changed from upcomingWeek
    };
  }

  /**
   * Clean up orphaned audits (audits where company no longer exists)
   */
  async cleanupOrphanedAudits(): Promise<{ deletedCount: number; deletedAuditIds: string[] }> {
    const allAudits = await AuditModel.findMany();
    const orphanedAudits: string[] = [];

    for (const audit of allAudits) {
      const company = await CompanyModel.findById(audit.companyId);
      if (!company) {
        orphanedAudits.push(audit.$id);
      }
    }

    // Delete orphaned audits
    for (const auditId of orphanedAudits) {
      await AuditModel.delete(auditId);
    }

    console.log(`🧹 Cleaned up ${orphanedAudits.length} orphaned audits`);
    return { deletedCount: orphanedAudits.length, deletedAuditIds: orphanedAudits };
  }

  /**
   * Clean up orphaned notifications (notifications for users that no longer exist)
   */
  async cleanupOrphanedNotifications(): Promise<{ deletedCount: number; deletedNotificationIds: string[] }> {
    try {
      const allNotifications = await NotificationModel.findMany({}, 1000); // Get up to 1000 notifications
      const orphanedNotifications: string[] = [];

      for (const notification of allNotifications) {
        const user = await UserModel.findById(notification.userId);
        if (!user) {
          orphanedNotifications.push(notification.$id);
        }
      }

      // Delete orphaned notifications
      for (const notificationId of orphanedNotifications) {
        await NotificationModel.delete(notificationId);
      }

      console.log(`🧹 Cleaned up ${orphanedNotifications.length} orphaned notifications`);
      return { deletedCount: orphanedNotifications.length, deletedNotificationIds: orphanedNotifications };
    } catch (error) {
      console.error('Error cleaning up orphaned notifications:', error);
      return { deletedCount: 0, deletedNotificationIds: [] };
    }
  }
}
