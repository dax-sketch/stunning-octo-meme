import * as cron from 'node-cron';
import { NotificationService } from './notificationService';
import { AuditService } from './auditService';
import { TierService } from './tierService';
import { CompanyModel } from '../models/AppwriteCompany';
import { UserModel } from '../models/AppwriteUser';
import { NotificationModel } from '../models/AppwriteNotification';
import { USER_ROLES, NOTIFICATION_TYPES } from '../config/appwrite';

export interface SchedulerConfig {
    meetingReminderCron: string; // Default: '0 9 * * *' (9 AM daily)
    notificationProcessingCron: string; // Default: '*/5 * * * *' (every 5 minutes)
    tierUpdateCron: string; // Default: '0 2 * * *' (2 AM daily)
    auditScheduleUpdateCron: string; // Default: '0 3 * * *' (3 AM daily)
    overdueAuditCheckCron: string; // Default: '0 8 * * *' (8 AM daily)
}

export class SchedulerService {
    private static instance: SchedulerService;
    private config: SchedulerConfig;
    private jobs: Map<string, cron.ScheduledTask> = new Map();

    private constructor(config?: Partial<SchedulerConfig>) {
        this.config = {
            meetingReminderCron: config?.meetingReminderCron || '0 9 * * *',
            notificationProcessingCron: config?.notificationProcessingCron || '*/5 * * * *',
            tierUpdateCron: config?.tierUpdateCron || '0 2 * * *',
            auditScheduleUpdateCron: config?.auditScheduleUpdateCron || '0 3 * * *',
            overdueAuditCheckCron: config?.overdueAuditCheckCron || '0 8 * * *',
        };
    }

    static getInstance(config?: Partial<SchedulerConfig>): SchedulerService {
        if (!SchedulerService.instance) {
            SchedulerService.instance = new SchedulerService(config);
        }
        return SchedulerService.instance;
    }

    /**
     * Initialize all scheduled jobs
     */
    public initializeJobs(): void {
        console.log('Initializing scheduled jobs...');

        // Job 1: Process scheduled notifications - DISABLED FOR NOW
        // this.scheduleJob('processNotifications', this.config.notificationProcessingCron, async () => {
        //     await this.processScheduledNotifications();
        // });

        // Job 2: Check for meeting reminders - DISABLED FOR NOW
        // this.scheduleJob('meetingReminders', this.config.meetingReminderCron, async () => {
        //     await this.checkMeetingReminders();
        // });

        // Job 3: Update company tiers
        this.scheduleJob('tierUpdates', this.config.tierUpdateCron, async () => {
            await this.updateCompanyTiers();
        });

        // Job 4: Update audit schedules based on company age
        this.scheduleJob('auditScheduleUpdates', this.config.auditScheduleUpdateCron, async () => {
            await this.updateAuditSchedules();
        });

        // Job 5: Check for overdue audits
        this.scheduleJob('overdueAuditCheck', this.config.overdueAuditCheckCron, async () => {
            await this.processOverdueAudits();
        });

        console.log('All scheduled jobs initialized successfully');
    }

    /**
     * Schedule a new cron job
     */
    private scheduleJob(name: string, cronExpression: string, task: () => Promise<void>): void {
        if (this.jobs.has(name)) {
            console.log(`Job ${name} already exists, stopping previous instance`);
            this.jobs.get(name)?.stop();
        }

        const job = cron.schedule(cronExpression, async () => {
            console.log(`Running scheduled job: ${name}`);
            try {
                await task();
                console.log(`Completed scheduled job: ${name}`);
            } catch (error) {
                console.error(`Error in scheduled job ${name}:`, error);
            }
        }, {
            scheduled: false, // Don't start immediately
            timezone: 'America/New_York' // Adjust timezone as needed
        });

        this.jobs.set(name, job);
        job.start();
        console.log(`Scheduled job '${name}' with cron expression: ${cronExpression}`);
    }

    /**
     * Process all scheduled notifications
     */
    private async processScheduledNotifications(): Promise<void> {
        try {
            await NotificationService.processScheduledNotifications();
        } catch (error) {
            console.error('Error processing scheduled notifications:', error);
        }
    }

    /**
     * Check for companies that need meeting reminders (1 month after start date)
     */
    private async checkMeetingReminders(): Promise<void> {
        try {
            console.log('Checking for meeting reminders...');

            // Calculate date range for companies that started 1 month ago
            const today = new Date();
            const oneMonthAgo = new Date();
            oneMonthAgo.setMonth(today.getMonth() - 1);

            // Get date range for companies that started exactly 1 month ago (±1 day buffer)
            const startDateFrom = new Date(oneMonthAgo);
            startDateFrom.setDate(startDateFrom.getDate() - 1);

            const startDateTo = new Date(oneMonthAgo);
            startDateTo.setDate(startDateTo.getDate() + 1);

            // Find companies that started around 1 month ago
            const companies = await CompanyModel.findMany({
                startDateFrom,
                startDateTo
            });

            console.log(`Found ${companies.length} companies that started around 1 month ago`);

            // Get CEO users
            const ceoUsers = await UserModel.findByRole(USER_ROLES.CEO);
            const ceosWithReminders = ceoUsers.filter(user => false); // user.meetingReminders - DISABLED FOR NOW

            if (ceosWithReminders.length === 0) {
                console.log('No CEO users found with meeting reminders enabled');
                return;
            }

            // Create meeting reminders for each company and each CEO
            for (const company of companies) {
                // Check if we already created a meeting reminder for this company today
                const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

                const existingReminders = await NotificationModel.findMany({
                    type: NOTIFICATION_TYPES.MEETING_REMINDER,
                    relatedCompanyId: company.$id,
                });

                // Filter to check if any reminder was created today
                const todayReminder = existingReminders.find(reminder => {
                    const createdDate = new Date(reminder.$createdAt);
                    return createdDate >= todayStart && createdDate < todayEnd;
                });

                if (todayReminder) {
                    console.log(`Meeting reminder already exists for company ${company.name}`);
                    continue;
                }

                // Create meeting reminder for each CEO
                for (const ceo of ceosWithReminders) {
                    try {
                        await NotificationService.createMeetingReminder(
                            ceo.$id,
                            company.$id,
                            new Date() // Schedule for immediate processing
                        );
                        console.log(`Created meeting reminder for CEO ${ceo.username} and company ${company.name}`);
                    } catch (error) {
                        console.error(`Error creating meeting reminder for CEO ${ceo.username} and company ${company.name}:`, error);
                    }
                }
            }
        } catch (error) {
            console.error('Error checking meeting reminders:', error);
        }
    }

    /**
     * Update company tiers based on current data
     */
    private async updateCompanyTiers(): Promise<void> {
        try {
            console.log('Updating company tiers...');
            const tierService = new TierService();
            const result = await tierService.updateAllTiers();
            console.log(`Updated tiers for ${result.updatedCount} out of ${result.totalCompanies} companies`);

            if (result.changes.length > 0) {
                console.log('Tier changes:');
                result.changes.forEach(change => {
                    console.log(`  - ${change.companyName}: ${change.oldTier} → ${change.newTier}`);
                });
            }
        } catch (error) {
            console.error('Error updating company tiers:', error);
        }
    }

    /**
     * Update audit schedules for all companies based on their current age
     */
    private async updateAuditSchedules(): Promise<void> {
        try {
            console.log('Updating audit schedules...');
            const auditService = new AuditService();
            const result = await auditService.updateAuditSchedulesForAllCompanies();
            console.log(`Updated ${result.updated} audit schedules, created ${result.created} new audits`);
        } catch (error) {
            console.error('Error updating audit schedules:', error);
        }
    }

    /**
     * Process overdue audits and send notifications
     */
    private async processOverdueAudits(): Promise<void> {
        try {
            console.log('Processing overdue audits...');
            const auditService = new AuditService();
            const result = await auditService.processOverdueAudits();
            console.log(`Processed ${result.markedCount} overdue audits, sent notifications for ${result.audits.length} audits`);
        } catch (error) {
            console.error('Error processing overdue audits:', error);
        }
    }

    /**
     * Schedule a custom meeting reminder for a specific company and user
     */
    public async scheduleMeetingReminder(
        userId: string,
        companyId: string,
        scheduledFor: Date,
        customMessage?: string
    ): Promise<void> {
        // DISABLED FOR NOW - All meeting reminders are disabled
        console.log(`Meeting reminder disabled for user ${userId} and company ${companyId} at ${scheduledFor}`);
        return;
        
        // try {
        //     // Validate that user exists and has meeting reminders enabled
        //     const user = await UserModel.findById(userId);
        //     if (!user) {
        //         throw new Error('User not found');
        //     }

        //     if (!user.meetingReminders) {
        //         console.log(`User ${user.username} has meeting reminders disabled`);
        //         return;
        //     }

        //     // Validate that company exists
        //     const company = await CompanyModel.findById(companyId);
        //     if (!company) {
        //         throw new Error('Company not found');
        //     }

        //     // Create the notification
        //     await NotificationService.createNotification({
        //         userId,
        //         type: NOTIFICATION_TYPES.MEETING_REMINDER,
        //         title: 'Scheduled Meeting Reminder',
        //         message: customMessage || `Meeting reminder for ${company.name}`,
        //         scheduledFor,
        //         relatedCompanyId: companyId
        //     });

        //     console.log(`Scheduled meeting reminder for user ${user.username} and company ${company.name} at ${scheduledFor}`);
        // } catch (error) {
        //     console.error('Error scheduling meeting reminder:', error);
        //     throw error;
        // }
    }

    /**
     * Get scheduler status and job information
     */
    public getStatus(): {
        isRunning: boolean;
        jobs: Array<{ name: string; running: boolean; cronExpression: string }>;
        config: SchedulerConfig;
    } {
        const jobStatus = Array.from(this.jobs.entries()).map(([name, job]) => ({
            name,
            running: true, // Assume running if in jobs map
            cronExpression: this.getCronExpressionForJob(name)
        }));

        return {
            isRunning: this.jobs.size > 0,
            jobs: jobStatus,
            config: this.config
        };
    }

    private getCronExpressionForJob(jobName: string): string {
        switch (jobName) {
            case 'processNotifications':
                return this.config.notificationProcessingCron;
            case 'meetingReminders':
                return this.config.meetingReminderCron;
            case 'tierUpdates':
                return this.config.tierUpdateCron;
            case 'auditScheduleUpdates':
                return this.config.auditScheduleUpdateCron;
            case 'overdueAuditCheck':
                return this.config.overdueAuditCheckCron;
            default:
                return 'unknown';
        }
    }

    /**
     * Stop all scheduled jobs
     */
    public stopAllJobs(): void {
        console.log('Stopping all scheduled jobs...');
        this.jobs.forEach((job, name) => {
            job.stop();
            console.log(`Stopped job: ${name}`);
        });
        this.jobs.clear();
        console.log('All scheduled jobs stopped');
    }

    /**
     * Restart all jobs with new configuration
     */
    public restartJobs(newConfig?: Partial<SchedulerConfig>): void {
        this.stopAllJobs();
        if (newConfig) {
            this.config = { ...this.config, ...newConfig };
        }
        this.initializeJobs();
    }
}