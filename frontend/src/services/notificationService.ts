import axios from 'axios';
import { RecentNotification } from '../types/dashboard';
import { API_BASE_URL } from '../config/api';

const notificationAPI = axios.create({
  baseURL: `${API_BASE_URL}/api/notifications`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
notificationAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface Notification extends RecentNotification {
  category: 'audit' | 'company' | 'system' | 'role';
}

export interface NotificationFilters {
  type?: 'MEETING_REMINDER' | 'AUDIT_DUE' | 'COMPANY_MILESTONE';
  isRead?: boolean;
  category?: 'audit' | 'company' | 'system' | 'role';
  search?: string;
}

export interface NotificationPreferences {
  emailNotifications: boolean;
  smsNotifications: boolean;
  meetingReminders: boolean;
  auditReminders: boolean;
}

export const notificationService = {
  async getRecentNotifications(
    limit: number = 5
  ): Promise<{ success: boolean; data?: RecentNotification[]; error?: any }> {
    try {
      const response = await notificationAPI.get(`?limit=${limit}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Failed to fetch notifications. Please try again.',
        },
      };
    }
  },

  async getAllNotifications(
    filters?: NotificationFilters,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ success: boolean; data?: Notification[]; error?: any }> {
    try {
      const params = new URLSearchParams();
      if (filters?.type) params.append('type', filters.type);
      if (filters?.isRead !== undefined)
        params.append('isRead', filters.isRead.toString());
      if (filters?.category) params.append('category', filters.category);
      if (filters?.search) params.append('search', filters.search);
      params.append('limit', limit.toString());
      params.append('offset', offset.toString());

      const response = await notificationAPI.get(`/all?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      console.error('Notification service error:', error);
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Failed to fetch notifications. Please try again.',
        },
      };
    }
  },

  async getUnreadCount(): Promise<{
    success: boolean;
    data?: { unreadCount: number };
    error?: any;
  }> {
    try {
      const response = await notificationAPI.get('/unread-count');
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Failed to fetch unread count. Please try again.',
        },
      };
    }
  },

  async markAsRead(id: string): Promise<{ success: boolean; error?: any }> {
    try {
      const response = await notificationAPI.post(`/${id}/mark-read`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Failed to mark notification as read. Please try again.',
        },
      };
    }
  },

  async markAsUnread(id: string): Promise<{ success: boolean; error?: any }> {
    try {
      const response = await notificationAPI.post(`/${id}/mark-unread`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Failed to mark notification as unread. Please try again.',
        },
      };
    }
  },

  async markAllAsRead(): Promise<{ success: boolean; error?: any }> {
    try {
      const response = await notificationAPI.post('/mark-all-read');
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message:
            'Failed to mark all notifications as read. Please try again.',
        },
      };
    }
  },

  async deleteNotification(
    id: string
  ): Promise<{ success: boolean; error?: any }> {
    try {
      const response = await notificationAPI.delete(`/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Failed to delete notification. Please try again.',
        },
      };
    }
  },

  async getNotificationPreferences(): Promise<{
    success: boolean;
    data?: NotificationPreferences;
    error?: any;
  }> {
    try {
      const response = await notificationAPI.get('/preferences');
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message:
            'Failed to fetch notification preferences. Please try again.',
        },
      };
    }
  },

  async updateNotificationPreferences(
    preferences: Partial<NotificationPreferences>
  ): Promise<{ success: boolean; error?: any }> {
    try {
      const response = await notificationAPI.put('/preferences', preferences);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message:
            'Failed to update notification preferences. Please try again.',
        },
      };
    }
  },

  // Alias for getRecentNotifications to match hook expectations
  getNotifications: async function (limit?: number) {
    return this.getRecentNotifications(limit);
  },
};
