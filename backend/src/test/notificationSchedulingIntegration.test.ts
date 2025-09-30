import request from 'supertest';
import app from '../server';
import { PrismaClient } from '@prisma/client';
import { SchedulerService } from '../services/schedulerService';
import { NotificationService } from '../services/notificationService';
import { EmailService } from '../services/emailService';
import { SMSService } from '../services/smsService';
import jwt from 'jsonwebtoken';

// Mock external services
jest.mock('../services/emailService');
jest.mock('../services/smsService');
jest.mock('node-cron');

const prisma = new PrismaClient();

describe('Notification Scheduling Integration Tests', () => {
  let authToken: string;
  let testUser: any;
  let testCompany: any;
  let ceoUser: any;

  beforeAll(async () => {
    // Clean up test data
    await prisma.notification.deleteMany({});
    await prisma.note.deleteMany({});
    await prisma.company.deleteMany({});
    await prisma.user.deleteMany({});

    // Create test users
    testUser = await prisma.user.create({
      data: {
        username: 'testuser',
        email: 'test@example.com',
        phoneNumber: '+1234567890',
        password: 'hashedpassword',
        role: 'TEAM_MEMBER',
        emailNotifications: true,
        smsNotifications: true,
        meetingReminders: true,
        auditReminders: true
      }
    });

    ceoUser = await prisma.user.create({
      data: {
        username: 'ceouser',
        email: 'ceo@example.com',
        phoneNumber: '+1234567891',
        password: 'hashedpassword',
        role: 'CEO',
        emailNotifications: true,
        smsNotifications: true,
        meetingReminders: true,
        auditReminders: true
      }
    });

    // Create test company
    testCompany = await prisma.company.create({
      data: {
        name: 'Test Company',
        startDate: new Date('2024-10-01'), // 1 month ago from test date
        phoneNumber: '+1234567892',
        email: 'company@example.com',
        website: 'https://testcompany.com',
        adSpend: 1000,
        tier: 'TIER_2',
        createdBy: testUser.id
      }
    });

    // Generate auth token
    authToken = jwt.sign(
      { userId: testUser.id, username: testUser.username, role: testUser.role },
      process.env.JWT_SECRET || 'test-secret'
    );

    // Mock external services
    (EmailService.sendMeetingReminder as jest.Mock).mockResolvedValue(true);
    (SMSService.sendMeetingReminder as jest.Mock).mockResolvedValue(true);
  });

  afterAll(async () => {
    // Clean up
    await prisma.notification.deleteMany({});
    await prisma.note.deleteMany({});
    await prisma.company.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.$disconnect();

    // Stop scheduler
    const scheduler = SchedulerService.getInstance();
    scheduler.stopAllJobs();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Scheduler Status API', () => {
    it('should get scheduler status', async () => {
      const response = await request(app)
        .get('/api/notifications/scheduler/status')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('isRunning');
      expect(response.body.data).toHaveProperty('jobs');
      expect(response.body.data).toHaveProperty('config');
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/notifications/scheduler/status')
        .expect(401);
    });
  });

  describe('Manual Meeting Reminder Scheduling', () => {
    it('should schedule meeting reminder successfully', async () => {
      const scheduledFor = new Date();
      scheduledFor.setDate(scheduledFor.getDate() + 1); // Tomorrow

      const response = await request(app)
        .post('/api/notifications/scheduler/meeting-reminder')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          companyId: testCompany.id,
          scheduledFor: scheduledFor.toISOString(),
          customMessage: 'Custom meeting reminder'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Meeting reminder scheduled successfully');

      // Verify notification was created in database
      const notification = await prisma.notification.findFirst({
        where: {
          userId: testUser.id,
          relatedCompanyId: testCompany.id,
          type: 'MEETING_REMINDER'
        }
      });

      expect(notification).toBeTruthy();
      expect(notification?.title).toBe('Scheduled Meeting Reminder');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/notifications/scheduler/meeting-reminder')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          // Missing companyId and scheduledFor
          customMessage: 'Test message'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should validate future date', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1); // Yesterday

      const response = await request(app)
        .post('/api/notifications/scheduler/meeting-reminder')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          companyId: testCompany.id,
          scheduledFor: pastDate.toISOString()
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should handle non-existent company', async () => {
      const scheduledFor = new Date();
      scheduledFor.setDate(scheduledFor.getDate() + 1);

      const response = await request(app)
        .post('/api/notifications/scheduler/meeting-reminder')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          companyId: 'non-existent-id',
          scheduledFor: scheduledFor.toISOString()
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('Scheduler Restart API', () => {
    it('should allow CEO to restart scheduler', async () => {
      const ceoToken = jwt.sign(
        { userId: ceoUser.id, username: ceoUser.username, role: ceoUser.role },
        process.env.JWT_SECRET || 'test-secret'
      );

      const response = await request(app)
        .post('/api/notifications/scheduler/restart')
        .set('Authorization', `Bearer ${ceoToken}`)
        .send({
          meetingReminderCron: '0 8 * * *'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Scheduler restarted successfully');
      expect(response.body.data.config.meetingReminderCron).toBe('0 8 * * *');
    });

    it('should deny access to team members', async () => {
      const response = await request(app)
        .post('/api/notifications/scheduler/restart')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          meetingReminderCron: '0 8 * * *'
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });
  });

  describe('Automated Meeting Reminder Processing', () => {
    it('should create meeting reminders for companies that started 1 month ago', async () => {
      // Create a company that started exactly 1 month ago
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      const monthOldCompany = await prisma.company.create({
        data: {
          name: 'Month Old Company',
          startDate: oneMonthAgo,
          phoneNumber: '+1234567893',
          email: 'monthold@example.com',
          website: 'https://montholdcompany.com',
          adSpend: 2000,
          tier: 'TIER_2',
          createdBy: testUser.id
        }
      });

      // Manually trigger the meeting reminder check
      const scheduler = SchedulerService.getInstance();
      await (scheduler as any).checkMeetingReminders();

      // Verify notification was created for CEO
      const notification = await prisma.notification.findFirst({
        where: {
          userId: ceoUser.id,
          relatedCompanyId: monthOldCompany.id,
          type: 'MEETING_REMINDER'
        }
      });

      expect(notification).toBeTruthy();

      // Clean up
      await prisma.company.delete({ where: { id: monthOldCompany.id } });
    });

    it('should process scheduled notifications', async () => {
      // Create a notification scheduled for now
      const notification = await prisma.notification.create({
        data: {
          userId: testUser.id,
          type: 'MEETING_REMINDER',
          title: 'Test Meeting Reminder',
          message: 'Test message',
          scheduledFor: new Date(), // Now
          relatedCompanyId: testCompany.id,
          isRead: false
        }
      });

      // Process scheduled notifications
      await NotificationService.processScheduledNotifications();

      // Verify notification was marked as sent
      const updatedNotification = await prisma.notification.findUnique({
        where: { id: notification.id }
      });

      expect(updatedNotification?.sentAt).toBeTruthy();
      expect(EmailService.sendMeetingReminder).toHaveBeenCalled();
      expect(SMSService.sendMeetingReminder).toHaveBeenCalled();
    });

    it('should not send notifications to users with disabled preferences', async () => {
      // Create user with disabled meeting reminders
      const userWithDisabledReminders = await prisma.user.create({
        data: {
          username: 'disableduser',
          email: 'disabled@example.com',
          phoneNumber: '+1234567894',
          password: 'hashedpassword',
          role: 'TEAM_MEMBER',
          emailNotifications: true,
          smsNotifications: true,
          meetingReminders: false, // Disabled
          auditReminders: true
        }
      });

      // Create notification for this user
      const notification = await prisma.notification.create({
        data: {
          userId: userWithDisabledReminders.id,
          type: 'MEETING_REMINDER',
          title: 'Test Meeting Reminder',
          message: 'Test message',
          scheduledFor: new Date(),
          relatedCompanyId: testCompany.id,
          isRead: false
        }
      });

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Process scheduled notifications
      await NotificationService.processScheduledNotifications();

      // Verify notification was not sent
      const updatedNotification = await prisma.notification.findUnique({
        where: { id: notification.id }
      });

      expect(updatedNotification?.sentAt).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        'User disableduser has disabled MEETING_REMINDER notifications'
      );

      // Clean up
      await prisma.user.delete({ where: { id: userWithDisabledReminders.id } });
      consoleSpy.mockRestore();
    });
  });

  describe('Notification History and Logging', () => {
    it('should track notification delivery attempts', async () => {
      // Create and send a notification
      const notification = await NotificationService.createMeetingReminder(
        testUser.id,
        testCompany.id,
        new Date()
      );

      // Mock successful delivery
      (EmailService.sendMeetingReminder as jest.Mock).mockResolvedValue(true);
      (SMSService.sendMeetingReminder as jest.Mock).mockResolvedValue(true);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Send the notification
      const notificationWithUser = {
        ...notification,
        user: {
          id: testUser.id,
          username: testUser.username,
          email: testUser.email,
          phoneNumber: testUser.phoneNumber,
          emailNotifications: testUser.emailNotifications,
          smsNotifications: testUser.smsNotifications,
          meetingReminders: testUser.meetingReminders,
          auditReminders: testUser.auditReminders
        },
        relatedCompany: {
          id: testCompany.id,
          name: testCompany.name
        }
      };

      await NotificationService.sendNotification(notificationWithUser as any);

      // Verify logging occurred (check console output since we're using console logging)
      expect(consoleSpy).toHaveBeenCalledWith(
        'Notification Log:',
        expect.stringContaining('"status":"SUCCESS"')
      );

      consoleSpy.mockRestore();
    });

    it('should get delivery statistics', async () => {
      const stats = await NotificationService.getDeliveryStats({
        userId: testUser.id
      });

      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('successful');
      expect(stats).toHaveProperty('failed');
      expect(stats).toHaveProperty('pending');
      expect(stats).toHaveProperty('successRate');
    });
  });

  describe('Custom Notification Features', () => {
    it('should create custom meeting reminder with additional recipients', async () => {
      const notifications = await NotificationService.createCustomMeetingReminder(
        testUser.id,
        testCompany.id,
        new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        'Custom meeting message',
        {
          title: 'Custom Meeting Title',
          additionalRecipients: [ceoUser.id],
          priority: 'HIGH'
        }
      );

      expect(notifications).toHaveLength(2); // Primary + 1 additional
      
      // Verify both notifications were created
      const primaryNotification = notifications.find(n => n.userId === testUser.id);
      const additionalNotification = notifications.find(n => n.userId === ceoUser.id);

      expect(primaryNotification).toBeTruthy();
      expect(additionalNotification).toBeTruthy();
      expect(primaryNotification?.title).toBe('Custom Meeting Title');
      expect(additionalNotification?.title).toBe('Custom Meeting Title');
    });

    it('should update notification timing', async () => {
      // Create a notification
      const notification = await NotificationService.createMeetingReminder(
        testUser.id,
        testCompany.id,
        new Date(Date.now() + 24 * 60 * 60 * 1000) // Tomorrow
      );

      // Update the timing
      const newDate = new Date(Date.now() + 48 * 60 * 60 * 1000); // Day after tomorrow
      const updatedNotification = await NotificationService.updateNotificationTiming(
        notification.id,
        newDate
      );

      expect(updatedNotification.scheduledFor.getTime()).toBe(newDate.getTime());
    });

    it('should cancel scheduled notification', async () => {
      // Create a notification
      const notification = await NotificationService.createMeetingReminder(
        testUser.id,
        testCompany.id,
        new Date(Date.now() + 24 * 60 * 60 * 1000) // Tomorrow
      );

      // Cancel the notification
      await NotificationService.cancelNotification(notification.id);

      // Verify it was deleted
      const deletedNotification = await prisma.notification.findUnique({
        where: { id: notification.id }
      });

      expect(deletedNotification).toBeNull();
    });

    it('should create bulk meeting reminders', async () => {
      // Create additional test companies
      const company2 = await prisma.company.create({
        data: {
          name: 'Test Company 2',
          startDate: new Date(),
          phoneNumber: '+1234567895',
          email: 'company2@example.com',
          website: 'https://testcompany2.com',
          adSpend: 1500,
          tier: 'TIER_2',
          createdBy: testUser.id
        }
      });

      const company3 = await prisma.company.create({
        data: {
          name: 'Test Company 3',
          startDate: new Date(),
          phoneNumber: '+1234567896',
          email: 'company3@example.com',
          website: 'https://testcompany3.com',
          adSpend: 2000,
          tier: 'TIER_1',
          createdBy: testUser.id
        }
      });

      // Create bulk reminders
      const notifications = await NotificationService.bulkCreateMeetingReminders(
        testUser.id,
        [testCompany.id, company2.id, company3.id],
        new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        'Bulk meeting reminder'
      );

      expect(notifications).toHaveLength(3);

      // Clean up
      await prisma.company.delete({ where: { id: company2.id } });
      await prisma.company.delete({ where: { id: company3.id } });
    });
  });
});