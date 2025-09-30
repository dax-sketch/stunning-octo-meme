import { Request, Response } from 'express';
import { NotificationModel, NotificationFilters } from '../models/AppwriteNotification';
import { NotificationService } from '../services/notificationService';
import { UserModel } from '../models/AppwriteUser';
import { USER_ROLES, type UserRole } from '../config/appwrite';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    username: string;
    email: string;
    role: UserRole;
  };
}

export class NotificationController {
  static async getNotifications(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } });
        return;
      }

      const { type, isRead, limit = '50', offset = '0' } = req.query;
      
      const filters: NotificationFilters = { userId };
      if (type) filters.type = type as any;
      if (isRead !== undefined) filters.isRead = isRead === 'true';

      const notifications = await NotificationModel.findMany(
        filters,
        parseInt(limit as string),
        parseInt(offset as string)
      );

      res.json({
        success: true,
        data: notifications
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch notifications'
        }
      });
    }
  }

  static async getNotificationById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;

      if (!userId) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } });
        return;
      }

      if (!id) {
        res.status(400).json({ success: false, error: { code: 'INVALID_ID', message: 'Notification ID is required' } });
        return;
      }

      const notification = await NotificationModel.findById(id);
      
      if (!notification) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Notification not found'
          }
        });
        return;
      }

      // Check if user owns this notification
      if (notification.userId !== userId) {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Access denied'
          }
        });
        return;
      }

      res.json({
        success: true,
        data: notification
      });
    } catch (error) {
      console.error('Error fetching notification:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch notification'
        }
      });
    }
  }

  static async getAllNotifications(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } });
        return;
      }

      const { type, isRead, category, search, limit = '50', offset = '0' } = req.query;
      
      console.log('getAllNotifications called for userId:', userId);
      console.log('Query params:', { type, isRead, category, search, limit, offset });
      
      const filters: NotificationFilters = { userId };
      if (type) filters.type = type as any;
      if (isRead !== undefined) filters.isRead = isRead === 'true';

      console.log('Filters being applied:', filters);

      let notifications = await NotificationModel.findMany(
        filters,
        parseInt(limit as string),
        parseInt(offset as string)
      );

      console.log('Raw notifications found:', notifications.length);

      // Apply client-side filtering for search and category since Appwrite doesn't support complex queries
      if (search || category) {
        notifications = notifications.filter(notification => {
          let matches = true;
          
          if (search) {
            const searchLower = (search as string).toLowerCase();
            matches = matches && (
              notification.title.toLowerCase().includes(searchLower) ||
              notification.message.toLowerCase().includes(searchLower)
            );
          }
          
          if (category) {
            // Map notification types to categories
            const notificationCategory = NotificationController.getNotificationCategory(notification.type);
            matches = matches && notificationCategory === category;
          }
          
          return matches;
        });
      }

      console.log('Filtered notifications:', notifications.length);

      res.json({
        success: true,
        data: notifications.map(notification => ({
          ...notification,
          category: NotificationController.getNotificationCategory(notification.type)
        }))
      });
    } catch (error: any) {
      console.error('Error fetching all notifications:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch notifications'
        }
      });
    }
  }

  private static getNotificationCategory(type: string): string {
    switch (type) {
      case 'MEETING_REMINDER':
      case 'AUDIT_DUE':
        return 'audit';
      case 'COMPANY_MILESTONE':
        return 'company';
      default:
        return 'system';
    }
  }

  static async markAsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;

      if (!userId) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } });
        return;
      }

      if (!id) {
        res.status(400).json({ success: false, error: { code: 'INVALID_ID', message: 'Notification ID is required' } });
        return;
      }

      const notification = await NotificationModel.findById(id);
      
      if (!notification) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Notification not found'
          }
        });
        return;
      }

      // Check if user owns this notification
      if (notification.userId !== userId) {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Access denied'
          }
        });
        return;
      }

      const updatedNotification = await NotificationModel.markAsRead(id);

      res.json({
        success: true,
        data: updatedNotification
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to mark notification as read'
        }
      });
    }
  }

  static async markAsUnread(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;

      if (!userId) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } });
        return;
      }

      if (!id) {
        res.status(400).json({ success: false, error: { code: 'INVALID_ID', message: 'Notification ID is required' } });
        return;
      }

      const notification = await NotificationModel.findById(id);
      
      if (!notification) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Notification not found'
          }
        });
        return;
      }

      // Check if user owns this notification
      if (notification.userId !== userId) {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Access denied'
          }
        });
        return;
      }

      // Update notification to mark as unread
      const updatedNotification = await NotificationModel.update(id, { isRead: false });

      res.json({
        success: true,
        data: updatedNotification
      });
    } catch (error) {
      console.error('Error marking notification as unread:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to mark notification as unread'
        }
      });
    }
  }

  static async markAllAsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } });
        return;
      }

      const count = await NotificationModel.markAllAsRead(userId);

      res.json({
        success: true,
        data: { markedCount: count }
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to mark all notifications as read'
        }
      });
    }
  }

  static async getUnreadCount(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } });
        return;
      }

      const count = await NotificationModel.getUnreadCount(userId);

      res.json({
        success: true,
        data: { unreadCount: count }
      });
    } catch (error) {
      console.error('Error fetching unread count:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch unread count'
        }
      });
    }
  }

  static async getNotificationPreferences(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } });
        return;
      }

      const user = await UserModel.findById(userId);
      
      if (!user) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'User not found'
          }
        });
        return;
      }

      res.json({
        success: true,
        data: {
          emailNotifications: user.emailNotifications,
          smsNotifications: user.smsNotifications,
          meetingReminders: user.meetingReminders,
          auditReminders: user.auditReminders
        }
      });
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch notification preferences'
        }
      });
    }
  }

  static async updateNotificationPreferences(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { emailNotifications, smsNotifications, meetingReminders, auditReminders } = req.body;

      if (!userId) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } });
        return;
      }

      const updateData: any = {};
      if (emailNotifications !== undefined) updateData.emailNotifications = emailNotifications;
      if (smsNotifications !== undefined) updateData.smsNotifications = smsNotifications;
      if (meetingReminders !== undefined) updateData.meetingReminders = meetingReminders;
      if (auditReminders !== undefined) updateData.auditReminders = auditReminders;

      const updatedUser = await UserModel.update(userId, updateData);

      res.json({
        success: true,
        data: {
          emailNotifications: updatedUser.emailNotifications,
          smsNotifications: updatedUser.smsNotifications,
          meetingReminders: updatedUser.meetingReminders,
          auditReminders: updatedUser.auditReminders
        }
      });
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update notification preferences'
        }
      });
    }
  }

  static async createNotification(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId, type, title, message, scheduledFor, relatedCompanyId } = req.body;

      // Only allow admins or the user themselves to create notifications
      const requestingUserId = req.user?.userId;
      const requestingUserRole = req.user?.role;
      
      if (!requestingUserId) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } });
        return;
      }

      if (requestingUserId !== userId && requestingUserRole !== 'CEO' && requestingUserRole !== 'MANAGER') {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Access denied'
          }
        });
        return;
      }

      // Temporarily disabled - service needs Appwrite migration
      res.status(501).json({
        success: false,
        error: {
          code: 'NOT_IMPLEMENTED',
          message: 'Notification creation temporarily disabled during Appwrite migration',
        },
      });
      return;
      
      /* const notification = await NotificationService.createNotification({
        userId,
        type,
        title,
        message,
        scheduledFor: new Date(scheduledFor),
        relatedCompanyId
      });

      res.status(201).json({
        success: true,
        data: notification
      }); */
    } catch (error) {
      console.error('Error creating notification:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create notification'
        }
      });
    }
  }

  static async deleteNotification(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const userRole = req.user?.role;
      const { id } = req.params;

      if (!userId) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } });
        return;
      }

      if (!id) {
        res.status(400).json({ success: false, error: { code: 'INVALID_ID', message: 'Notification ID is required' } });
        return;
      }

      const notification = await NotificationModel.findById(id);
      
      if (!notification) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Notification not found'
          }
        });
        return;
      }

      // Check if user owns this notification or is admin
      if (notification.userId !== userId && userRole !== 'CEO' && userRole !== 'MANAGER') {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Access denied'
          }
        });
        return;
      }

      await NotificationModel.delete(id);

      res.json({
        success: true,
        message: 'Notification deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete notification'
        }
      });
    }
  }
}