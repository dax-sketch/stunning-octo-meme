import request from 'supertest';
import app from '../server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

describe('Notification Integration Tests', () => {
  let authToken: string;
  let userId: string;
  let companyId: string;

  beforeAll(async () => {
    // Clean up test data
    await prisma.notification.deleteMany({});
    await prisma.note.deleteMany({});
    await prisma.company.deleteMany({});
    await prisma.user.deleteMany({});

    // Create test user
    const user = await prisma.user.create({
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

    userId = user.id;

    // Create test company
    const company = await prisma.company.create({
      data: {
        name: 'Test Company',
        startDate: new Date('2024-01-01'),
        phoneNumber: '+1987654321',
        email: 'company@example.com',
        website: 'https://testcompany.com',
        createdBy: userId
      }
    });

    companyId = company.id;

    // Generate auth token
    authToken = jwt.sign(
      { id: userId, username: 'testuser', role: 'TEAM_MEMBER' },
      process.env.JWT_SECRET || 'test-secret'
    );
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.notification.deleteMany({});
    await prisma.note.deleteMany({});
    await prisma.company.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
  });

  describe('POST /api/notifications', () => {
    it('should create a notification', async () => {
      const notificationData = {
        userId,
        type: 'MEETING_REMINDER',
        title: 'Meeting Reminder',
        message: 'You have a meeting scheduled',
        scheduledFor: '2024-01-15T10:00:00Z',
        relatedCompanyId: companyId
      };

      const response = await request(app)
        .post('/api/notifications')
        .set('Authorization', `Bearer ${authToken}`)
        .send(notificationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        userId,
        type: 'MEETING_REMINDER',
        title: 'Meeting Reminder',
        message: 'You have a meeting scheduled',
        relatedCompanyId: companyId,
        isRead: false
      });
    });

    it('should return 403 when team member tries to create notification for other user', async () => {
      const otherUser = await prisma.user.create({
        data: {
          username: 'otheruser',
          email: 'other@example.com',
          phoneNumber: '+1111111111',
          password: 'hashedpassword',
          role: 'TEAM_MEMBER'
        }
      });

      const notificationData = {
        userId: otherUser.id,
        type: 'MEETING_REMINDER',
        title: 'Meeting Reminder',
        message: 'You have a meeting scheduled',
        scheduledFor: '2024-01-15T10:00:00Z'
      };

      const response = await request(app)
        .post('/api/notifications')
        .set('Authorization', `Bearer ${authToken}`)
        .send(notificationData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');

      // Clean up
      await prisma.user.delete({ where: { id: otherUser.id } });
    });
  });

  describe('GET /api/notifications', () => {
    let notificationId: string;

    beforeEach(async () => {
      // Create test notification
      const notification = await prisma.notification.create({
        data: {
          userId,
          type: 'MEETING_REMINDER',
          title: 'Test Notification',
          message: 'Test message',
          scheduledFor: new Date('2024-01-15T10:00:00Z'),
          relatedCompanyId: companyId
        }
      });
      notificationId = notification.id;
    });

    afterEach(async () => {
      // Clean up
      await prisma.notification.deleteMany({});
    });

    it('should get user notifications', async () => {
      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toMatchObject({
        userId,
        type: 'MEETING_REMINDER',
        title: 'Test Notification',
        message: 'Test message',
        isRead: false
      });
    });

    it('should filter notifications by type', async () => {
      // Create another notification with different type
      await prisma.notification.create({
        data: {
          userId,
          type: 'AUDIT_DUE',
          title: 'Audit Notification',
          message: 'Audit message',
          scheduledFor: new Date('2024-01-16T10:00:00Z'),
          relatedCompanyId: companyId
        }
      });

      const response = await request(app)
        .get('/api/notifications?type=MEETING_REMINDER')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].type).toBe('MEETING_REMINDER');
    });

    it('should filter notifications by read status', async () => {
      // Mark one notification as read
      await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true }
      });

      const response = await request(app)
        .get('/api/notifications?isRead=false')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
    });
  });

  describe('GET /api/notifications/:id', () => {
    let notificationId: string;

    beforeEach(async () => {
      const notification = await prisma.notification.create({
        data: {
          userId,
          type: 'MEETING_REMINDER',
          title: 'Test Notification',
          message: 'Test message',
          scheduledFor: new Date('2024-01-15T10:00:00Z'),
          relatedCompanyId: companyId
        }
      });
      notificationId = notification.id;
    });

    afterEach(async () => {
      await prisma.notification.deleteMany({});
    });

    it('should get notification by id', async () => {
      const response = await request(app)
        .get(`/api/notifications/${notificationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(notificationId);
    });

    it('should return 404 for non-existent notification', async () => {
      const response = await request(app)
        .get('/api/notifications/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('PATCH /api/notifications/:id/read', () => {
    let notificationId: string;

    beforeEach(async () => {
      const notification = await prisma.notification.create({
        data: {
          userId,
          type: 'MEETING_REMINDER',
          title: 'Test Notification',
          message: 'Test message',
          scheduledFor: new Date('2024-01-15T10:00:00Z'),
          relatedCompanyId: companyId,
          isRead: false
        }
      });
      notificationId = notification.id;
    });

    afterEach(async () => {
      await prisma.notification.deleteMany({});
    });

    it('should mark notification as read', async () => {
      const response = await request(app)
        .patch(`/api/notifications/${notificationId}/read`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isRead).toBe(true);

      // Verify in database
      const notification = await prisma.notification.findUnique({
        where: { id: notificationId }
      });
      expect(notification?.isRead).toBe(true);
    });
  });

  describe('PATCH /api/notifications/mark-all-read', () => {
    beforeEach(async () => {
      // Create multiple unread notifications
      await prisma.notification.createMany({
        data: [
          {
            userId,
            type: 'MEETING_REMINDER',
            title: 'Notification 1',
            message: 'Message 1',
            scheduledFor: new Date('2024-01-15T10:00:00Z'),
            isRead: false
          },
          {
            userId,
            type: 'AUDIT_DUE',
            title: 'Notification 2',
            message: 'Message 2',
            scheduledFor: new Date('2024-01-16T10:00:00Z'),
            isRead: false
          }
        ]
      });
    });

    afterEach(async () => {
      await prisma.notification.deleteMany({});
    });

    it('should mark all notifications as read', async () => {
      const response = await request(app)
        .patch('/api/notifications/mark-all-read')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.markedCount).toBe(2);

      // Verify in database
      const unreadCount = await prisma.notification.count({
        where: { userId, isRead: false }
      });
      expect(unreadCount).toBe(0);
    });
  });

  describe('GET /api/notifications/unread-count', () => {
    beforeEach(async () => {
      // Create notifications with mixed read status
      await prisma.notification.createMany({
        data: [
          {
            userId,
            type: 'MEETING_REMINDER',
            title: 'Unread 1',
            message: 'Message 1',
            scheduledFor: new Date('2024-01-15T10:00:00Z'),
            isRead: false
          },
          {
            userId,
            type: 'AUDIT_DUE',
            title: 'Unread 2',
            message: 'Message 2',
            scheduledFor: new Date('2024-01-16T10:00:00Z'),
            isRead: false
          },
          {
            userId,
            type: 'COMPANY_MILESTONE',
            title: 'Read 1',
            message: 'Message 3',
            scheduledFor: new Date('2024-01-17T10:00:00Z'),
            isRead: true
          }
        ]
      });
    });

    afterEach(async () => {
      await prisma.notification.deleteMany({});
    });

    it('should return unread notification count', async () => {
      const response = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.unreadCount).toBe(2);
    });
  });

  describe('PATCH /api/notifications/preferences', () => {
    it('should update notification preferences', async () => {
      const preferences = {
        emailNotifications: false,
        smsNotifications: true,
        meetingReminders: false,
        auditReminders: true
      };

      const response = await request(app)
        .patch('/api/notifications/preferences')
        .set('Authorization', `Bearer ${authToken}`)
        .send(preferences)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject(preferences);

      // Verify in database
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });
      expect(user?.emailNotifications).toBe(false);
      expect(user?.smsNotifications).toBe(true);
      expect(user?.meetingReminders).toBe(false);
      expect(user?.auditReminders).toBe(true);
    });
  });

  describe('DELETE /api/notifications/:id', () => {
    let notificationId: string;

    beforeEach(async () => {
      const notification = await prisma.notification.create({
        data: {
          userId,
          type: 'MEETING_REMINDER',
          title: 'Test Notification',
          message: 'Test message',
          scheduledFor: new Date('2024-01-15T10:00:00Z')
        }
      });
      notificationId = notification.id;
    });

    it('should delete notification', async () => {
      const response = await request(app)
        .delete(`/api/notifications/${notificationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Notification deleted successfully');

      // Verify deletion in database
      const notification = await prisma.notification.findUnique({
        where: { id: notificationId }
      });
      expect(notification).toBeNull();
    });
  });
});