import { NotificationService } from '../services/notificationService';
import { NotificationModel } from '../models/Notification';
import { NotificationLogModel } from '../models/NotificationLog';
import { EmailService } from '../services/emailService';
import { SMSService } from '../services/smsService';
import { NotificationType } from '@prisma/client';

// Mock dependencies
jest.mock('../models/Notification');
jest.mock('../models/NotificationLog');
jest.mock('../services/emailService');
jest.mock('../services/smsService');

describe('NotificationService', () => {
  const mockNotification = {
    id: 'notification1',
    userId: 'user1',
    type: 'MEETING_REMINDER' as NotificationType,
    title: 'Test Notification',
    message: 'Test message',
    scheduledFor: new Date('2024-12-01T10:00:00Z'),
    relatedCompanyId: 'company1',
    isRead: false,
    sentAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    user: {
      id: 'user1',
      username: 'testuser',
      email: 'test@example.com',
      phoneNumber: '+1234567890',
      emailNotifications: true,
      smsNotifications: true,
      meetingReminders: true,
      auditReminders: true
    },
    relatedCompany: {
      id: 'company1',
      name: 'Test Company'
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createNotification', () => {
    it('should create notification successfully', async () => {
      (NotificationModel.create as jest.Mock).mockResolvedValue(mockNotification);

      const result = await NotificationService.createNotification({
        userId: 'user1',
        type: 'MEETING_REMINDER',
        title: 'Test Notification',
        message: 'Test message',
        scheduledFor: new Date('2024-12-01T10:00:00Z'),
        relatedCompanyId: 'company1'
      });

      expect(NotificationModel.create).toHaveBeenCalledWith({
        userId: 'user1',
        type: 'MEETING_REMINDER',
        title: 'Test Notification',
        message: 'Test message',
        scheduledFor: new Date('2024-12-01T10:00:00Z'),
        relatedCompanyId: 'company1'
      });
      expect(result).toEqual(mockNotification);
    });
  });

  describe('sendNotification', () => {
    it('should send email and SMS notifications successfully', async () => {
      (EmailService.sendMeetingReminder as jest.Mock).mockResolvedValue(true);
      (SMSService.sendMeetingReminder as jest.Mock).mockResolvedValue(true);
      (NotificationLogModel.logPending as jest.Mock).mockResolvedValue({});
      (NotificationLogModel.logSuccess as jest.Mock).mockResolvedValue({});
      (NotificationModel.update as jest.Mock).mockResolvedValue(mockNotification);

      const result = await NotificationService.sendNotification(mockNotification as any);

      expect(EmailService.sendMeetingReminder).toHaveBeenCalledWith(
        'test@example.com',
        'testuser',
        'Test Company',
        mockNotification.scheduledFor
      );
      expect(SMSService.sendMeetingReminder).toHaveBeenCalledWith(
        '+1234567890',
        'testuser',
        'Test Company',
        mockNotification.scheduledFor
      );
      expect(NotificationLogModel.logSuccess).toHaveBeenCalledTimes(2);
      expect(NotificationModel.update).toHaveBeenCalledWith('notification1', { sentAt: expect.any(Date) });
      expect(result).toBe(true);
    });

    it('should skip notifications if user has disabled them', async () => {
      const notificationWithDisabledUser = {
        ...mockNotification,
        user: {
          ...mockNotification.user,
          meetingReminders: false
        }
      };

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const result = await NotificationService.sendNotification(notificationWithDisabledUser as any);

      expect(consoleSpy).toHaveBeenCalledWith('User testuser has disabled MEETING_REMINDER notifications');
      expect(EmailService.sendMeetingReminder).not.toHaveBeenCalled();
      expect(SMSService.sendMeetingReminder).not.toHaveBeenCalled();
      expect(result).toBe(false);

      consoleSpy.mockRestore();
    });

    it('should handle email sending failure gracefully', async () => {
      (EmailService.sendMeetingReminder as jest.Mock).mockResolvedValue(false);
      (SMSService.sendMeetingReminder as jest.Mock).mockResolvedValue(true);
      (NotificationLogModel.logPending as jest.Mock).mockResolvedValue({});
      (NotificationLogModel.logFailure as jest.Mock).mockResolvedValue({});
      (NotificationLogModel.logSuccess as jest.Mock).mockResolvedValue({});
      (NotificationModel.update as jest.Mock).mockResolvedValue(mockNotification);

      const result = await NotificationService.sendNotification(mockNotification as any);

      expect(NotificationLogModel.logFailure).toHaveBeenCalledWith(
        'notification1',
        'EMAIL',
        'Email sending failed'
      );
      expect(NotificationLogModel.logSuccess).toHaveBeenCalledWith(
        'notification1',
        'SMS',
        expect.any(Object)
      );
      expect(result).toBe(true); // Should still return true because SMS succeeded
    });

    it('should handle email service error', async () => {
      const emailError = new Error('Email service error');
      (EmailService.sendMeetingReminder as jest.Mock).mockRejectedValue(emailError);
      (SMSService.sendMeetingReminder as jest.Mock).mockResolvedValue(true);
      (NotificationLogModel.logPending as jest.Mock).mockResolvedValue({});
      (NotificationLogModel.logFailure as jest.Mock).mockResolvedValue({});
      (NotificationLogModel.logSuccess as jest.Mock).mockResolvedValue({});
      (NotificationModel.update as jest.Mock).mockResolvedValue(mockNotification);

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await NotificationService.sendNotification(mockNotification as any);

      expect(NotificationLogModel.logFailure).toHaveBeenCalledWith(
        'notification1',
        'EMAIL',
        'Email service error'
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith('Email notification error:', emailError);
      expect(result).toBe(true); // Should still return true because SMS succeeded

      consoleErrorSpy.mockRestore();
    });

    it('should return false if both email and SMS fail', async () => {
      (EmailService.sendMeetingReminder as jest.Mock).mockResolvedValue(false);
      (SMSService.sendMeetingReminder as jest.Mock).mockResolvedValue(false);
      (NotificationLogModel.logPending as jest.Mock).mockResolvedValue({});
      (NotificationLogModel.logFailure as jest.Mock).mockResolvedValue({});

      const result = await NotificationService.sendNotification(mockNotification as any);

      expect(NotificationLogModel.logFailure).toHaveBeenCalledTimes(2);
      expect(NotificationModel.update).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });

  describe('processScheduledNotifications', () => {
    it('should process all scheduled notifications', async () => {
      const scheduledNotifications = [mockNotification, { ...mockNotification, id: 'notification2' }];
      (NotificationModel.getScheduledNotifications as jest.Mock).mockResolvedValue(scheduledNotifications);
      
      const sendNotificationSpy = jest.spyOn(NotificationService, 'sendNotification').mockResolvedValue(true);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await NotificationService.processScheduledNotifications();

      expect(NotificationModel.getScheduledNotifications).toHaveBeenCalled();
      expect(sendNotificationSpy).toHaveBeenCalledTimes(2);
      expect(consoleSpy).toHaveBeenCalledWith('Processing 2 scheduled notifications');

      sendNotificationSpy.mockRestore();
      consoleSpy.mockRestore();
    });

    it('should handle errors in individual notifications', async () => {
      const scheduledNotifications = [mockNotification];
      (NotificationModel.getScheduledNotifications as jest.Mock).mockResolvedValue(scheduledNotifications);
      
      const sendNotificationSpy = jest.spyOn(NotificationService, 'sendNotification')
        .mockRejectedValue(new Error('Send error'));
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await NotificationService.processScheduledNotifications();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error processing notification notification1:',
        expect.any(Error)
      );

      sendNotificationSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('createCustomMeetingReminder', () => {
    it('should create custom meeting reminder with additional recipients', async () => {
      (NotificationModel.create as jest.Mock).mockResolvedValue(mockNotification);

      const result = await NotificationService.createCustomMeetingReminder(
        'user1',
        'company1',
        new Date('2024-12-01T10:00:00Z'),
        'Custom message',
        {
          title: 'Custom Title',
          additionalRecipients: ['user2', 'user3'],
          priority: 'HIGH'
        }
      );

      expect(NotificationModel.create).toHaveBeenCalledTimes(3); // Primary + 2 additional
      expect(result).toHaveLength(3);
    });

    it('should handle errors for additional recipients gracefully', async () => {
      (NotificationModel.create as jest.Mock)
        .mockResolvedValueOnce(mockNotification) // Primary user succeeds
        .mockRejectedValueOnce(new Error('User not found')) // First additional fails
        .mockResolvedValueOnce(mockNotification); // Second additional succeeds

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await NotificationService.createCustomMeetingReminder(
        'user1',
        'company1',
        new Date('2024-12-01T10:00:00Z'),
        'Custom message',
        {
          additionalRecipients: ['user2', 'user3']
        }
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to create notification for recipient user2:',
        expect.any(Error)
      );
      expect(result).toHaveLength(2); // Primary + one successful additional

      consoleErrorSpy.mockRestore();
    });
  });

  describe('updateNotificationTiming', () => {
    it('should update notification timing successfully', async () => {
      const notificationWithoutSentAt = { ...mockNotification, sentAt: null };
      (NotificationModel.findById as jest.Mock).mockResolvedValue(notificationWithoutSentAt);
      (NotificationModel.update as jest.Mock).mockResolvedValue(mockNotification);

      const newDate = new Date('2024-12-02T10:00:00Z');
      const result = await NotificationService.updateNotificationTiming('notification1', newDate);

      expect(NotificationModel.findById).toHaveBeenCalledWith('notification1');
      expect(NotificationModel.update).toHaveBeenCalledWith('notification1', {
        scheduledFor: newDate
      });
      expect(result).toEqual(mockNotification);
    });

    it('should throw error if notification not found', async () => {
      (NotificationModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        NotificationService.updateNotificationTiming('notification1', new Date())
      ).rejects.toThrow('Notification not found');
    });

    it('should throw error if notification already sent', async () => {
      const sentNotification = { ...mockNotification, sentAt: new Date() };
      (NotificationModel.findById as jest.Mock).mockResolvedValue(sentNotification);

      await expect(
        NotificationService.updateNotificationTiming('notification1', new Date())
      ).rejects.toThrow('Cannot update timing for already sent notification');
    });
  });

  describe('bulkCreateMeetingReminders', () => {
    it('should create meeting reminders for multiple companies', async () => {
      const createMeetingReminderSpy = jest.spyOn(NotificationService, 'createMeetingReminder')
        .mockResolvedValue(mockNotification);

      const companyIds = ['company1', 'company2', 'company3'];
      const scheduledFor = new Date('2024-12-01T10:00:00Z');

      const result = await NotificationService.bulkCreateMeetingReminders(
        'user1',
        companyIds,
        scheduledFor,
        'Bulk reminder'
      );

      expect(createMeetingReminderSpy).toHaveBeenCalledTimes(3);
      expect(result).toHaveLength(3);

      createMeetingReminderSpy.mockRestore();
    });

    it('should handle errors for individual companies gracefully', async () => {
      const createMeetingReminderSpy = jest.spyOn(NotificationService, 'createMeetingReminder')
        .mockResolvedValueOnce(mockNotification)
        .mockRejectedValueOnce(new Error('Company not found'))
        .mockResolvedValueOnce(mockNotification);

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const companyIds = ['company1', 'company2', 'company3'];
      const result = await NotificationService.bulkCreateMeetingReminders(
        'user1',
        companyIds,
        new Date()
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to create meeting reminder for company company2:',
        expect.any(Error)
      );
      expect(result).toHaveLength(2); // Two successful

      createMeetingReminderSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('cancelNotification', () => {
    it('should cancel notification successfully', async () => {
      const notificationWithoutSentAt = { ...mockNotification, sentAt: null };
      (NotificationModel.findById as jest.Mock).mockResolvedValue(notificationWithoutSentAt);
      (NotificationModel.delete as jest.Mock).mockResolvedValue(undefined);

      await NotificationService.cancelNotification('notification1');

      expect(NotificationModel.findById).toHaveBeenCalledWith('notification1');
      expect(NotificationModel.delete).toHaveBeenCalledWith('notification1');
    });

    it('should throw error if notification not found', async () => {
      (NotificationModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        NotificationService.cancelNotification('notification1')
      ).rejects.toThrow('Notification not found');
    });

    it('should throw error if notification already sent', async () => {
      const sentNotification = { ...mockNotification, sentAt: new Date() };
      (NotificationModel.findById as jest.Mock).mockResolvedValue(sentNotification);

      await expect(
        NotificationService.cancelNotification('notification1')
      ).rejects.toThrow('Cannot cancel already sent notification');
    });
  });

  describe('getDeliveryStats', () => {
    it('should return delivery statistics', async () => {
      const mockStats = {
        total: 100,
        successful: 85,
        failed: 10,
        pending: 5,
        successRate: 0.85
      };
      (NotificationLogModel.getDeliveryStats as jest.Mock).mockResolvedValue(mockStats);

      const result = await NotificationService.getDeliveryStats({
        userId: 'user1',
        dateFrom: new Date('2024-11-01'),
        dateTo: new Date('2024-11-30')
      });

      expect(NotificationLogModel.getDeliveryStats).toHaveBeenCalledWith({
        userId: 'user1',
        dateFrom: new Date('2024-11-01'),
        dateTo: new Date('2024-11-30')
      });
      expect(result).toEqual(mockStats);
    });
  });

  describe('getNotificationHistory', () => {
    it('should return notification history', async () => {
      const mockHistory = [
        { id: 'log1', notificationId: 'notification1', method: 'EMAIL', status: 'SUCCESS' },
        { id: 'log2', notificationId: 'notification1', method: 'SMS', status: 'SUCCESS' }
      ];
      (NotificationLogModel.getHistory as jest.Mock).mockResolvedValue(mockHistory);

      const result = await NotificationService.getNotificationHistory(
        { userId: 'user1' },
        50,
        0
      );

      expect(NotificationLogModel.getHistory).toHaveBeenCalledWith(
        { userId: 'user1' },
        50,
        0
      );
      expect(result).toEqual(mockHistory);
    });
  });
});