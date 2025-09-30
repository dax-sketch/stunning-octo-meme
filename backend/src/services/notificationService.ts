import { NotificationModel, CreateNotificationData, AppwriteNotification } from '../models/AppwriteNotification';
import { UserModel, AppwriteUser } from '../models/AppwriteUser';
import { CompanyModel, AppwriteCompany } from '../models/AppwriteCompany';
import { EmailService } from './emailService';
import { SMSService } from './smsService';
import { NOTIFICATION_TYPES, type NotificationType } from '../config/appwrite';

export interface NotificationPreferences {
    emailNotifications: boolean;
    smsNotifications: boolean;
    meetingReminders: boolean;
    auditReminders: boolean;
}

export interface UserWithPreferences {
    $id: string;
    username: string;
    email: string;
    phoneNumber: string;
    emailNotifications: boolean;
    smsNotifications: boolean;
    meetingReminders: boolean;
    auditReminders: boolean;
}

export class NotificationService {
    static async createNotification(data: CreateNotificationData): Promise<AppwriteNotification> {
        return await NotificationModel.create(data);
    }

    static async sendNotification(notification: AppwriteNotification): Promise<boolean> {
        try {
            // Get user details
            const user = await UserModel.findById(notification.userId);
            if (!user) {
                console.error(`User ${notification.userId} not found for notification ${notification.$id}`);
                return false;
            }

            // Get company details if related
            let company: AppwriteCompany | null = null;
            if (notification.relatedCompanyId) {
                company = await CompanyModel.findById(notification.relatedCompanyId);
            }

            // Check if user wants this type of notification
            if (!this.shouldSendNotification(notification.type, user)) {
                console.log(`User ${user.username} has disabled ${notification.type} notifications`);
                return false;
            }

            let emailSent = false;
            let smsSent = false;

            // Send email if user has email notifications enabled
            if (user.emailNotifications) {
                try {
                    emailSent = await this.sendEmailNotification(notification, user, company);
                } catch (error: any) {
                    console.error('Email notification error:', error);
                }
            }

            // Send SMS if user has SMS notifications enabled
            if (user.smsNotifications) {
                try {
                    smsSent = await this.sendSMSNotification(notification, user, company);
                } catch (error: any) {
                    console.error('SMS notification error:', error);
                }
            }

            // Mark notification as sent if at least one method succeeded
            if (emailSent || smsSent) {
                // Note: We would need to add a sentAt field to the notification model
                // For now, we'll just return success
                return true;
            }

            return false;
        } catch (error) {
            console.error(`Error sending notification ${notification.$id}:`, error);
            return false;
        }
    }

    private static shouldSendNotification(type: NotificationType, user: AppwriteUser): boolean {
        switch (type) {
            case NOTIFICATION_TYPES.MEETING_REMINDER:
                return user.meetingReminders;
            case NOTIFICATION_TYPES.AUDIT_DUE:
                return user.auditReminders;
            case NOTIFICATION_TYPES.COMPANY_MILESTONE:
                return true; // Always send milestone notifications
            default:
                return true;
        }
    }

    private static async sendEmailNotification(
        notification: AppwriteNotification,
        user: AppwriteUser,
        company: AppwriteCompany | null
    ): Promise<boolean> {
        const companyName = company?.name || 'Unknown Company';
        const scheduledDate = new Date(notification.scheduledFor);

        switch (notification.type) {
            case NOTIFICATION_TYPES.MEETING_REMINDER:
                return await EmailService.sendMeetingReminder(
                    user.email,
                    user.username,
                    companyName,
                    scheduledDate
                );
            case NOTIFICATION_TYPES.AUDIT_DUE:
                return await EmailService.sendAuditReminder(
                    user.email,
                    user.username,
                    companyName,
                    scheduledDate
                );
            case NOTIFICATION_TYPES.COMPANY_MILESTONE:
                return await EmailService.sendCompanyMilestone(
                    user.email,
                    user.username,
                    companyName,
                    notification.message
                );
            default:
                return await EmailService.sendEmail({
                    to: user.email,
                    subject: notification.title,
                    text: notification.message
                });
        }
    }

    private static async sendSMSNotification(
        notification: AppwriteNotification,
        user: AppwriteUser,
        company: AppwriteCompany | null
    ): Promise<boolean> {
        const companyName = company?.name || 'Unknown Company';
        const scheduledDate = new Date(notification.scheduledFor);

        switch (notification.type) {
            case NOTIFICATION_TYPES.MEETING_REMINDER:
                return await SMSService.sendMeetingReminder(
                    user.phoneNumber,
                    user.username,
                    companyName,
                    scheduledDate
                );
            case NOTIFICATION_TYPES.AUDIT_DUE:
                return await SMSService.sendAuditReminder(
                    user.phoneNumber,
                    user.username,
                    companyName,
                    scheduledDate
                );
            case NOTIFICATION_TYPES.COMPANY_MILESTONE:
                return await SMSService.sendCompanyMilestone(
                    user.phoneNumber,
                    user.username,
                    companyName,
                    notification.message
                );
            default:
                return await SMSService.sendSMS({
                    to: user.phoneNumber,
                    message: `${notification.title}: ${notification.message}`
                });
        }
    }

    static async processScheduledNotifications(): Promise<void> {
        try {
            // Get notifications that are scheduled for now or earlier and haven't been sent
            const now = new Date();
            const scheduledNotifications = await NotificationModel.findMany({
                // We would need to add a sentAt field to filter properly
                // For now, get all notifications scheduled for today or earlier
            });

            // Filter to only unsent notifications scheduled for now or earlier
            const unsentNotifications = scheduledNotifications.filter(notification => {
                const scheduledDate = new Date(notification.scheduledFor);
                return scheduledDate <= now && !notification.sentAt;
            });

            console.log(`Processing ${unsentNotifications.length} scheduled notifications`);

            for (const notification of unsentNotifications) {
                try {
                    await this.sendNotification(notification);
                    console.log(`Processed notification ${notification.$id}`);
                } catch (error) {
                    console.error(`Error processing notification ${notification.$id}:`, error);
                }
            }
        } catch (error) {
            console.error('Error processing scheduled notifications:', error);
        }
    }

    static async createMeetingReminder(
        userId: string,
        companyId: string,
        scheduledFor: Date
    ): Promise<AppwriteNotification> {
        return await this.createNotification({
            userId,
            type: NOTIFICATION_TYPES.MEETING_REMINDER,
            title: 'Meeting Reminder',
            message: 'You have a scheduled meeting with this company.',
            scheduledFor,
            relatedCompanyId: companyId
        });
    }

    static async createAuditReminder(
        userId: string,
        companyId: string,
        scheduledFor: Date
    ): Promise<AppwriteNotification> {
        return await this.createNotification({
            userId,
            type: NOTIFICATION_TYPES.AUDIT_DUE,
            title: 'Audit Due',
            message: 'An audit is due for this company.',
            scheduledFor,
            relatedCompanyId: companyId
        });
    }

    static async createCompanyMilestone(
        userId: string,
        companyId: string,
        milestone: string,
        scheduledFor: Date = new Date()
    ): Promise<AppwriteNotification> {
        return await this.createNotification({
            userId,
            type: NOTIFICATION_TYPES.COMPANY_MILESTONE,
            title: 'Company Milestone',
            message: milestone,
            scheduledFor,
            relatedCompanyId: companyId
        });
    }

    /**
     * Create customizable meeting reminder with specific timing
     */
    static async createCustomMeetingReminder(
        userId: string,
        companyId: string,
        scheduledFor: Date,
        customMessage?: string,
        reminderSettings?: {
            title?: string;
            additionalRecipients?: string[]; // Additional user IDs to notify
            priority?: 'LOW' | 'NORMAL' | 'HIGH';
        }
    ): Promise<AppwriteNotification[]> {
        const notifications: AppwriteNotification[] = [];

        // Create notification for primary user
        const primaryNotification = await this.createNotification({
            userId,
            type: NOTIFICATION_TYPES.MEETING_REMINDER,
            title: reminderSettings?.title || 'Meeting Reminder',
            message: customMessage || 'You have a scheduled meeting with this company.',
            scheduledFor,
            relatedCompanyId: companyId
        });
        notifications.push(primaryNotification);

        // Create notifications for additional recipients if specified
        if (reminderSettings?.additionalRecipients) {
            for (const recipientId of reminderSettings.additionalRecipients) {
                try {
                    const additionalNotification = await this.createNotification({
                        userId: recipientId,
                        type: NOTIFICATION_TYPES.MEETING_REMINDER,
                        title: reminderSettings?.title || 'Meeting Reminder (CC)',
                        message: customMessage || 'A meeting has been scheduled with this company.',
                        scheduledFor,
                        relatedCompanyId: companyId
                    });
                    notifications.push(additionalNotification);
                } catch (error) {
                    console.error(`Failed to create notification for recipient ${recipientId}:`, error);
                }
            }
        }

        return notifications;
    }

    /**
     * Get notifications for a user
     */
    static async getUserNotifications(
        userId: string,
        filters?: {
            type?: NotificationType;
            isRead?: boolean;
        },
        limit = 50,
        offset = 0
    ): Promise<AppwriteNotification[]> {
        return await NotificationModel.findMany({
            userId,
            ...filters
        }, limit, offset);
    }

    /**
     * Mark notification as read
     */
    static async markAsRead(notificationId: string): Promise<AppwriteNotification> {
        return await NotificationModel.markAsRead(notificationId);
    }

    /**
     * Mark all notifications as read for a user
     */
    static async markAllAsRead(userId: string): Promise<number> {
        return await NotificationModel.markAllAsRead(userId);
    }

    /**
     * Get unread count for a user
     */
    static async getUnreadCount(userId: string): Promise<number> {
        return await NotificationModel.getUnreadCount(userId);
    }

    /**
     * Bulk create meeting reminders for multiple companies
     */
    static async bulkCreateMeetingReminders(
        userId: string,
        companyIds: string[],
        scheduledFor: Date,
        customMessage?: string
    ): Promise<AppwriteNotification[]> {
        const notifications: AppwriteNotification[] = [];

        for (const companyId of companyIds) {
            try {
                const notification = await this.createMeetingReminder(
                    userId,
                    companyId,
                    scheduledFor
                );
                notifications.push(notification);
            } catch (error) {
                console.error(`Failed to create meeting reminder for company ${companyId}:`, error);
            }
        }

        return notifications;
    }

    /**
     * Cancel scheduled notification
     */
    static async cancelNotification(notificationId: string): Promise<void> {
        const notification = await NotificationModel.findById(notificationId);
        if (!notification) {
            throw new Error('Notification not found');
        }

        if (notification.sentAt) {
            throw new Error('Cannot cancel already sent notification');
        }

        await NotificationModel.delete(notificationId);
    }
}