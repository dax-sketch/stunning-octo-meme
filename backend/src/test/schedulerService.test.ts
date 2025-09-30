import { SchedulerService } from '../services/schedulerService';
import { NotificationService } from '../services/notificationService';
import { CompanyModel } from '../models/Company';
import { UserModel } from '../models/User';
import { PrismaClient } from '@prisma/client';

// Mock dependencies
jest.mock('../services/notificationService');
jest.mock('../models/Company');
jest.mock('../models/User');
jest.mock('node-cron');

const mockPrisma = {
  user: {
    findMany: jest.fn(),
  },
  notification: {
    findFirst: jest.fn(),
  },
} as any;

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

describe('SchedulerService', () => {
  let schedulerService: SchedulerService;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset singleton instance
    (SchedulerService as any).instance = null;
    schedulerService = SchedulerService.getInstance();
  });

  afterEach(() => {
    schedulerService.stopAllJobs();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = SchedulerService.getInstance();
      const instance2 = SchedulerService.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should accept custom configuration', () => {
      const config = {
        meetingReminderCron: '0 10 * * *',
        notificationProcessingCron: '*/10 * * * *'
      };

      const instance = SchedulerService.getInstance(config);
      const status = instance.getStatus();

      expect(status.config.meetingReminderCron).toBe('0 10 * * *');
      expect(status.config.notificationProcessingCron).toBe('*/10 * * * *');
    });
  });

  describe('initializeJobs', () => {
    it('should initialize all scheduled jobs', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      schedulerService.initializeJobs();

      expect(consoleSpy).toHaveBeenCalledWith('Initializing scheduled jobs...');
      expect(consoleSpy).toHaveBeenCalledWith('All scheduled jobs initialized successfully');

      const status = schedulerService.getStatus();
      expect(status.jobs).toHaveLength(3);
      expect(status.jobs.map(j => j.name)).toContain('processNotifications');
      expect(status.jobs.map(j => j.name)).toContain('meetingReminders');
      expect(status.jobs.map(j => j.name)).toContain('tierUpdates');

      consoleSpy.mockRestore();
    });
  });

  describe('scheduleMeetingReminder', () => {
    const mockUser = {
      id: 'user1',
      username: 'testuser',
      meetingReminders: true
    };

    const mockCompany = {
      id: 'company1',
      name: 'Test Company'
    };

    beforeEach(() => {
      (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);
      (CompanyModel.findById as jest.Mock).mockResolvedValue(mockCompany);
      (NotificationService.createNotification as jest.Mock).mockResolvedValue({
        id: 'notification1'
      });
    });

    it('should schedule meeting reminder successfully', async () => {
      const scheduledFor = new Date('2024-12-01T10:00:00Z');

      await schedulerService.scheduleMeetingReminder(
        'user1',
        'company1',
        scheduledFor,
        'Custom meeting message'
      );

      expect(UserModel.findById).toHaveBeenCalledWith('user1');
      expect(CompanyModel.findById).toHaveBeenCalledWith('company1');
      expect(NotificationService.createNotification).toHaveBeenCalledWith({
        userId: 'user1',
        type: 'MEETING_REMINDER',
        title: 'Scheduled Meeting Reminder',
        message: 'Custom meeting message',
        scheduledFor,
        relatedCompanyId: 'company1'
      });
    });

    it('should throw error if user not found', async () => {
      (UserModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        schedulerService.scheduleMeetingReminder('user1', 'company1', new Date())
      ).rejects.toThrow('User not found');
    });

    it('should throw error if company not found', async () => {
      (CompanyModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        schedulerService.scheduleMeetingReminder('user1', 'company1', new Date())
      ).rejects.toThrow('Company not found');
    });

    it('should skip if user has meeting reminders disabled', async () => {
      const userWithDisabledReminders = { ...mockUser, meetingReminders: false };
      (UserModel.findById as jest.Mock).mockResolvedValue(userWithDisabledReminders);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await schedulerService.scheduleMeetingReminder('user1', 'company1', new Date());

      expect(consoleSpy).toHaveBeenCalledWith('User testuser has meeting reminders disabled');
      expect(NotificationService.createNotification).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should use default message if custom message not provided', async () => {
      const scheduledFor = new Date('2024-12-01T10:00:00Z');

      await schedulerService.scheduleMeetingReminder('user1', 'company1', scheduledFor);

      expect(NotificationService.createNotification).toHaveBeenCalledWith({
        userId: 'user1',
        type: 'MEETING_REMINDER',
        title: 'Scheduled Meeting Reminder',
        message: 'Meeting reminder for Test Company',
        scheduledFor,
        relatedCompanyId: 'company1'
      });
    });
  });

  describe('checkMeetingReminders', () => {
    const mockCEOUsers = [
      {
        id: 'ceo1',
        username: 'ceo1',
        role: 'CEO',
        meetingReminders: true
      },
      {
        id: 'ceo2',
        username: 'ceo2',
        role: 'CEO',
        meetingReminders: true
      }
    ];

    const mockCompanies = [
      {
        id: 'company1',
        name: 'Company 1',
        startDate: new Date('2024-10-01')
      },
      {
        id: 'company2',
        name: 'Company 2',
        startDate: new Date('2024-10-02')
      }
    ];

    beforeEach(() => {
      mockPrisma.user.findMany.mockResolvedValue(mockCEOUsers);
      (CompanyModel.findMany as jest.Mock).mockResolvedValue(mockCompanies);
      mockPrisma.notification.findFirst.mockResolvedValue(null); // No existing reminders
      (NotificationService.createMeetingReminder as jest.Mock).mockResolvedValue({
        id: 'notification1'
      });
    });

    it('should create meeting reminders for companies that started 1 month ago', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Mock the private method by calling it through reflection
      await (schedulerService as any).checkMeetingReminders();

      expect(CompanyModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          startDateFrom: expect.any(Date),
          startDateTo: expect.any(Date)
        })
      );

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: {
          role: 'CEO',
          meetingReminders: true
        }
      });

      // Should create reminders for each company and each CEO
      expect(NotificationService.createMeetingReminder).toHaveBeenCalledTimes(4); // 2 companies × 2 CEOs

      consoleSpy.mockRestore();
    });

    it('should skip if no CEO users found', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await (schedulerService as any).checkMeetingReminders();

      expect(consoleSpy).toHaveBeenCalledWith('No CEO users found with meeting reminders enabled');
      expect(NotificationService.createMeetingReminder).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should skip if reminder already exists for company', async () => {
      mockPrisma.notification.findFirst.mockResolvedValue({ id: 'existing' });
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await (schedulerService as any).checkMeetingReminders();

      expect(consoleSpy).toHaveBeenCalledWith('Meeting reminder already exists for company Company 1');
      expect(consoleSpy).toHaveBeenCalledWith('Meeting reminder already exists for company Company 2');
      expect(NotificationService.createMeetingReminder).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should handle errors gracefully', async () => {
      (NotificationService.createMeetingReminder as jest.Mock)
        .mockRejectedValueOnce(new Error('Test error'))
        .mockResolvedValue({ id: 'notification1' });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await (schedulerService as any).checkMeetingReminders();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error creating meeting reminder'),
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('getStatus', () => {
    it('should return scheduler status', () => {
      schedulerService.initializeJobs();
      const status = schedulerService.getStatus();

      expect(status).toHaveProperty('isRunning');
      expect(status).toHaveProperty('jobs');
      expect(status).toHaveProperty('config');
      expect(status.jobs).toBeInstanceOf(Array);
      expect(status.config).toHaveProperty('meetingReminderCron');
      expect(status.config).toHaveProperty('notificationProcessingCron');
      expect(status.config).toHaveProperty('tierUpdateCron');
    });
  });

  describe('stopAllJobs', () => {
    it('should stop all running jobs', () => {
      schedulerService.initializeJobs();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      schedulerService.stopAllJobs();

      expect(consoleSpy).toHaveBeenCalledWith('Stopping all scheduled jobs...');
      expect(consoleSpy).toHaveBeenCalledWith('All scheduled jobs stopped');

      const status = schedulerService.getStatus();
      expect(status.isRunning).toBe(false);
      expect(status.jobs).toHaveLength(0);

      consoleSpy.mockRestore();
    });
  });

  describe('restartJobs', () => {
    it('should restart jobs with new configuration', () => {
      schedulerService.initializeJobs();

      const newConfig = {
        meetingReminderCron: '0 8 * * *'
      };

      schedulerService.restartJobs(newConfig);

      const status = schedulerService.getStatus();
      expect(status.config.meetingReminderCron).toBe('0 8 * * *');
      expect(status.isRunning).toBe(true);
    });
  });
});