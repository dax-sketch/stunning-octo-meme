import { NotificationModel, CreateNotificationData } from '../models/Notification';
import { PrismaClient } from '@prisma/client';

// Mock Prisma
jest.mock('@prisma/client');

const mockPrisma = {
  notification: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    updateMany: jest.fn(),
    count: jest.fn(),
  },
};

// Mock the PrismaClient constructor
(PrismaClient as jest.MockedClass<typeof PrismaClient>).mockImplementation(() => mockPrisma as any);

describe('NotificationModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a notification with valid data', async () => {
      const notificationData: CreateNotificationData = {
        userId: 'user-1',
        type: 'MEETING_REMINDER',
        title: 'Meeting Reminder',
        message: 'You have a meeting scheduled',
        scheduledFor: new Date('2024-01-15T10:00:00Z'),
        relatedCompanyId: 'company-1'
      };

      const mockNotification = {
        id: 'notification-1',
        ...notificationData,
        isRead: false,
        sentAt: null,
        createdAt: new Date(),
        user: {
          id: 'user-1',
          username: 'testuser',
          email: 'test@example.com',
          phoneNumber: '+1234567890',
          emailNotifications: true,
          smsNotifications: true
        },
        relatedCompany: {
          id: 'company-1',
          name: 'Test Company'
        }
      };

      mockPrisma.notification.create.mockResolvedValue(mockNotification);

      const result = await NotificationModel.create(notificationData);

      expect(mockPrisma.notification.create).toHaveBeenCalledWith({
        data: notificationData,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              phoneNumber: true,
              emailNotifications: true,
              smsNotifications: true
            }
          },
          relatedCompany: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });
      expect(result).toEqual(mockNotification);
    });

    it('should throw validation error for invalid data', async () => {
      const invalidData = {
        userId: '', // Invalid: empty string
        type: 'INVALID_TYPE' as any,
        title: '',
        message: '',
        scheduledFor: new Date()
      };

      await expect(NotificationModel.create(invalidData)).rejects.toThrow('Validation error');
    });
  });

  describe('findById', () => {
    it('should find notification by id', async () => {
      const mockNotification = {
        id: 'notification-1',
        userId: 'user-1',
        type: 'MEETING_REMINDER',
        title: 'Meeting Reminder',
        message: 'You have a meeting scheduled',
        isRead: false,
        scheduledFor: new Date(),
        sentAt: null,
        createdAt: new Date(),
        user: {
          id: 'user-1',
          username: 'testuser',
          email: 'test@example.com',
          phoneNumber: '+1234567890',
          emailNotifications: true,
          smsNotifications: true
        },
        relatedCompany: null
      };

      mockPrisma.notification.findUnique.mockResolvedValue(mockNotification);

      const result = await NotificationModel.findById('notification-1');

      expect(mockPrisma.notification.findUnique).toHaveBeenCalledWith({
        where: { id: 'notification-1' },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              phoneNumber: true,
              emailNotifications: true,
              smsNotifications: true
            }
          },
          relatedCompany: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });
      expect(result).toEqual(mockNotification);
    });

    it('should return null if notification not found', async () => {
      mockPrisma.notification.findUnique.mockResolvedValue(null);

      const result = await NotificationModel.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findMany', () => {
    it('should find notifications with filters', async () => {
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
          createdAt: new Date(),
          user: {
            id: 'user-1',
            username: 'testuser',
            email: 'test@example.com',
            phoneNumber: '+1234567890'
          },
          relatedCompany: null
        }
      ];

      mockPrisma.notification.findMany.mockResolvedValue(mockNotifications);

      const filters = { userId: 'user-1', isRead: false };
      const result = await NotificationModel.findMany(filters, 10, 0);

      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith({
        where: filters,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              phoneNumber: true
            }
          },
          relatedCompany: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        skip: 0
      });
      expect(result).toEqual(mockNotifications);
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
        isRead: true,
        scheduledFor: new Date(),
        sentAt: null,
        createdAt: new Date(),
        user: {
          id: 'user-1',
          username: 'testuser',
          email: 'test@example.com',
          phoneNumber: '+1234567890'
        },
        relatedCompany: null
      };

      mockPrisma.notification.update.mockResolvedValue(mockNotification);

      const result = await NotificationModel.markAsRead('notification-1');

      expect(mockPrisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'notification-1' },
        data: { isRead: true },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              phoneNumber: true
            }
          },
          relatedCompany: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });
      expect(result).toEqual(mockNotification);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all user notifications as read', async () => {
      mockPrisma.notification.updateMany.mockResolvedValue({ count: 5 });

      const result = await NotificationModel.markAllAsRead('user-1');

      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          isRead: false
        },
        data: { isRead: true }
      });
      expect(result).toBe(5);
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread notification count', async () => {
      mockPrisma.notification.count.mockResolvedValue(3);

      const result = await NotificationModel.getUnreadCount('user-1');

      expect(mockPrisma.notification.count).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          isRead: false
        }
      });
      expect(result).toBe(3);
    });
  });

  describe('getScheduledNotifications', () => {
    it('should return notifications scheduled for sending', async () => {
      const mockNotifications = [
        {
          id: 'notification-1',
          userId: 'user-1',
          type: 'MEETING_REMINDER',
          title: 'Meeting Reminder',
          message: 'You have a meeting scheduled',
          isRead: false,
          scheduledFor: new Date('2024-01-01T10:00:00Z'),
          sentAt: null,
          createdAt: new Date(),
          user: {
            id: 'user-1',
            username: 'testuser',
            email: 'test@example.com',
            phoneNumber: '+1234567890',
            emailNotifications: true,
            smsNotifications: true
          },
          relatedCompany: {
            id: 'company-1',
            name: 'Test Company'
          }
        }
      ];

      mockPrisma.notification.findMany.mockResolvedValue(mockNotifications);

      const result = await NotificationModel.getScheduledNotifications();

      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith({
        where: {
          scheduledFor: {
            lte: expect.any(Date)
          },
          sentAt: null
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              phoneNumber: true,
              emailNotifications: true,
              smsNotifications: true
            }
          },
          relatedCompany: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });
      expect(result).toEqual(mockNotifications);
    });
  });
});