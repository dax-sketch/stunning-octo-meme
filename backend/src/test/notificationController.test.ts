import { Request, Response } from 'express';
import { NotificationController, AuthenticatedRequest } from '../controllers/notificationController';
import { NotificationModel } from '../models/Notification';
import { NotificationService } from '../services/notificationService';
import { UserModel } from '../models/User';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';

// Mock dependencies
jest.mock('../models/Notification');
jest.mock('../services/notificationService');
jest.mock('../models/User');

const mockNotificationModel = NotificationModel as jest.Mocked<typeof NotificationModel>;
const mockNotificationService = NotificationService as jest.Mocked<typeof NotificationService>;
const mockUserModel = UserModel as jest.Mocked<typeof UserModel>;

describe('NotificationController', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    
    mockRequest = {
      user: {
        id: 'user-1',
        username: 'testuser',
        role: 'TEAM_MEMBER'
      },
      query: {},
      params: {},
      body: {}
    };
    
    mockResponse = {
      json: mockJson,
      status: mockStatus
    };

    jest.clearAllMocks();
  });

  describe('getNotifications', () => {
    it('should return user notifications', async () => {
      const mockNotifications = [
        {
          id: 'notification-1',
          userId: 'user-1',
          type: 'MEETING_REMINDER',
          title: 'Meeting Reminder',
          message: 'You have a meeting scheduled',
          isRead: false,
          scheduledFor: new Date(),
          sentAt: null,
          createdAt: new Date()
        }
      ];

      mockNotificationModel.findMany.mockResolvedValue(mockNotifications as any);

      await NotificationController.getNotifications(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockNotificationModel.findMany).toHaveBeenCalledWith(
        { userId: 'user-1' },
        50,
        0
      );
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockNotifications
      });
    });

    it('should return 401 if user not authenticated', async () => {
      delete mockRequest.user;

      await NotificationController.getNotifications(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User not authenticated' }
      });
    });

    it('should handle query parameters', async () => {
      mockRequest.query = {
        type: 'MEETING_REMINDER',
        isRead: 'false',
        limit: '10',
        offset: '5'
      };

      mockNotificationModel.findMany.mockResolvedValue([]);

      await NotificationController.getNotifications(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockNotificationModel.findMany).toHaveBeenCalledWith(
        { userId: 'user-1', type: 'MEETING_REMINDER', isRead: false },
        10,
        5
      );
    });
  });

  describe('getNotificationById', () => {
    it('should return notification by id', async () => {
      const mockNotification = {
        id: 'notification-1',
        userId: 'user-1',
        type: 'MEETING_REMINDER',
        title: 'Meeting Reminder',
        message: 'You have a meeting scheduled',
        isRead: false,
        scheduledFor: new Date(),
        sentAt: null,
        createdAt: new Date()
      };

      mockRequest.params = { id: 'notification-1' };
      mockNotificationModel.findById.mockResolvedValue(mockNotification as any);

      await NotificationController.getNotificationById(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockNotificationModel.findById).toHaveBeenCalledWith('notification-1');
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockNotification
      });
    });

    it('should return 404 if notification not found', async () => {
      mockRequest.params = { id: 'non-existent' };
      mockNotificationModel.findById.mockResolvedValue(null);

      await NotificationController.getNotificationById(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Notification not found' }
      });
    });

    it('should return 403 if user does not own notification', async () => {
      const mockNotification = {
        id: 'notification-1',
        userId: 'other-user',
        type: 'MEETING_REMINDER',
        title: 'Meeting Reminder',
        message: 'You have a meeting scheduled',
        isRead: false,
        scheduledFor: new Date(),
        sentAt: null,
        createdAt: new Date()
      };

      mockRequest.params = { id: 'notification-1' };
      mockNotificationModel.findById.mockResolvedValue(mockNotification as any);

      await NotificationController.getNotificationById(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(403);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied' }
      });
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const mockNotification = {
        id: 'notification-1',
        userId: 'user-1',
        type: 'MEETING_REMINDER',
        title: 'Meeting Reminder',
        message: 'You have a meeting scheduled',
        isRead: false,
        scheduledFor: new Date(),
        sentAt: null,
        createdAt: new Date()
      };

      const updatedNotification = { ...mockNotification, isRead: true };

      mockRequest.params = { id: 'notification-1' };
      mockNotificationModel.findById.mockResolvedValue(mockNotification as any);
      mockNotificationModel.markAsRead.mockResolvedValue(updatedNotification as any);

      await NotificationController.markAsRead(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockNotificationModel.markAsRead).toHaveBeenCalledWith('notification-1');
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: updatedNotification
      });
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      mockNotificationModel.markAllAsRead.mockResolvedValue(5);

      await NotificationController.markAllAsRead(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockNotificationModel.markAllAsRead).toHaveBeenCalledWith('user-1');
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: { markedCount: 5 }
      });
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread notification count', async () => {
      mockNotificationModel.getUnreadCount.mockResolvedValue(3);

      await NotificationController.getUnreadCount(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockNotificationModel.getUnreadCount).toHaveBeenCalledWith('user-1');
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: { unreadCount: 3 }
      });
    });
  });

  describe('updateNotificationPreferences', () => {
    it('should update notification preferences', async () => {
      const preferences = {
        emailNotifications: true,
        smsNotifications: false,
        meetingReminders: true,
        auditReminders: false
      };

      mockRequest.body = preferences;
      mockUserModel.update.mockResolvedValue({
        id: 'user-1',
        ...preferences
      } as any);

      await NotificationController.updateNotificationPreferences(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockUserModel.update).toHaveBeenCalledWith('user-1', preferences);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: preferences
      });
    });
  });

  describe('createNotification', () => {
    it('should create notification for same user', async () => {
      const notificationData = {
        userId: 'user-1',
        type: 'MEETING_REMINDER',
        title: 'Meeting Reminder',
        message: 'You have a meeting scheduled',
        scheduledFor: '2024-01-15T10:00:00Z',
        relatedCompanyId: 'company-1'
      };

      const mockNotification = {
        id: 'notification-1',
        ...notificationData,
        scheduledFor: new Date(notificationData.scheduledFor),
        isRead: false,
        sentAt: null,
        createdAt: new Date()
      };

      mockRequest.body = notificationData;
      mockNotificationService.createNotification.mockResolvedValue(mockNotification as any);

      await NotificationController.createNotification(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockNotificationService.createNotification).toHaveBeenCalledWith({
        ...notificationData,
        scheduledFor: new Date(notificationData.scheduledFor)
      });
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockNotification
      });
    });

    it('should allow CEO to create notification for other users', async () => {
      mockRequest.user!.role = 'CEO';
      const notificationData = {
        userId: 'other-user',
        type: 'MEETING_REMINDER',
        title: 'Meeting Reminder',
        message: 'You have a meeting scheduled',
        scheduledFor: '2024-01-15T10:00:00Z'
      };

      const mockNotification = {
        id: 'notification-1',
        ...notificationData,
        scheduledFor: new Date(notificationData.scheduledFor),
        isRead: false,
        sentAt: null,
        createdAt: new Date()
      };

      mockRequest.body = notificationData;
      mockNotificationService.createNotification.mockResolvedValue(mockNotification as any);

      await NotificationController.createNotification(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockNotificationService.createNotification).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(201);
    });

    it('should return 403 if team member tries to create notification for other user', async () => {
      const notificationData = {
        userId: 'other-user',
        type: 'MEETING_REMINDER',
        title: 'Meeting Reminder',
        message: 'You have a meeting scheduled',
        scheduledFor: '2024-01-15T10:00:00Z'
      };

      mockRequest.body = notificationData;

      await NotificationController.createNotification(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(403);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied' }
      });
    });
  });

  describe('deleteNotification', () => {
    it('should delete notification owned by user', async () => {
      const mockNotification = {
        id: 'notification-1',
        userId: 'user-1',
        type: 'MEETING_REMINDER',
        title: 'Meeting Reminder',
        message: 'You have a meeting scheduled',
        isRead: false,
        scheduledFor: new Date(),
        sentAt: null,
        createdAt: new Date()
      };

      mockRequest.params = { id: 'notification-1' };
      mockNotificationModel.findById.mockResolvedValue(mockNotification as any);
      mockNotificationModel.delete.mockResolvedValue();

      await NotificationController.deleteNotification(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockNotificationModel.delete).toHaveBeenCalledWith('notification-1');
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: 'Notification deleted successfully'
      });
    });

    it('should allow CEO to delete any notification', async () => {
      mockRequest.user!.role = 'CEO';
      const mockNotification = {
        id: 'notification-1',
        userId: 'other-user',
        type: 'MEETING_REMINDER',
        title: 'Meeting Reminder',
        message: 'You have a meeting scheduled',
        isRead: false,
        scheduledFor: new Date(),
        sentAt: null,
        createdAt: new Date()
      };

      mockRequest.params = { id: 'notification-1' };
      mockNotificationModel.findById.mockResolvedValue(mockNotification as any);
      mockNotificationModel.delete.mockResolvedValue();

      await NotificationController.deleteNotification(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockNotificationModel.delete).toHaveBeenCalledWith('notification-1');
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: 'Notification deleted successfully'
      });
    });
  });
});