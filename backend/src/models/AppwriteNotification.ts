import { databases, COLLECTIONS, generateId, NOTIFICATION_TYPES, type NotificationType } from '../config/appwrite';
import { Query } from 'appwrite';

export interface AppwriteNotification {
  $id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  scheduledFor: string;
  sentAt?: string;
  userId: string;
  relatedCompanyId?: string;
  $createdAt: string;
  $updatedAt: string;
}

export interface CreateNotificationData {
  type: NotificationType;
  title: string;
  message: string;
  scheduledFor: Date;
  userId: string;
  relatedCompanyId?: string;
}

export interface NotificationFilters {
  userId?: string;
  type?: NotificationType;
  isRead?: boolean;
  relatedCompanyId?: string;
}

export class NotificationModel {
  private static databaseId = process.env.APPWRITE_DATABASE_ID || 'client-management';
  private static collectionId = COLLECTIONS.NOTIFICATIONS;

  /**
   * Create a new notification
   */
  static async create(data: CreateNotificationData): Promise<AppwriteNotification> {
    const notificationData = {
      type: data.type,
      title: data.title,
      message: data.message,
      isRead: false,
      scheduledFor: data.scheduledFor.toISOString(),
      userId: data.userId,
      relatedCompanyId: data.relatedCompanyId || null,

    };

    return await databases.createDocument(
      this.databaseId,
      this.collectionId,
      generateId(),
      notificationData
    ) as unknown as AppwriteNotification;
  }

  /**
   * Find notification by ID
   */
  static async findById(id: string): Promise<AppwriteNotification | null> {
    try {
      return await databases.getDocument(
        this.databaseId,
        this.collectionId,
        id
      ) as unknown as AppwriteNotification;
    } catch (error: any) {
      if (error.code === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Find notifications with filters
   */
  static async findMany(filters: NotificationFilters, limit: number = 50, offset: number = 0): Promise<AppwriteNotification[]> {
    const queries = [];
    
    if (filters.userId) {
      queries.push(Query.equal('userId', filters.userId));
    }
    
    if (filters.type) {
      queries.push(Query.equal('type', filters.type));
    }
    
    if (filters.isRead !== undefined) {
      queries.push(Query.equal('isRead', filters.isRead));
    }
    
    if (filters.relatedCompanyId) {
      queries.push(Query.equal('relatedCompanyId', filters.relatedCompanyId));
    }
    
    queries.push(Query.limit(limit));
    queries.push(Query.offset(offset));
    queries.push(Query.orderDesc('$createdAt'));

    const response = await databases.listDocuments(
      this.databaseId,
      this.collectionId,
      queries
    );

    return response.documents as unknown as AppwriteNotification[];
  }

  /**
   * Update notification
   */
  static async update(id: string, data: Partial<AppwriteNotification>): Promise<AppwriteNotification> {
    return await databases.updateDocument(
      this.databaseId,
      this.collectionId,
      id,
      data
    ) as unknown as AppwriteNotification;
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(id: string): Promise<AppwriteNotification> {
    return await this.update(id, { isRead: true });
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: string): Promise<number> {
    // Get all unread notifications for the user
    const unreadNotifications = await this.findMany({ userId, isRead: false }, 1000);
    
    // Mark each as read
    let count = 0;
    for (const notification of unreadNotifications) {
      await this.markAsRead(notification.$id);
      count++;
    }
    
    return count;
  }

  /**
   * Get unread count for a user
   */
  static async getUnreadCount(userId: string): Promise<number> {
    const response = await databases.listDocuments(
      this.databaseId,
      this.collectionId,
      [
        Query.equal('userId', userId),
        Query.equal('isRead', false),
        Query.limit(1) // We only need the count
      ]
    );

    return response.total;
  }

  /**
   * Delete notification by ID
   */
  static async delete(id: string): Promise<void> {
    await databases.deleteDocument(
      this.databaseId,
      this.collectionId,
      id
    );
  }
}