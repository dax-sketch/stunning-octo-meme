import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Create axios instance with auth token
const createAuthenticatedRequest = () => {
  const token = localStorage.getItem('token');
  return axios.create({
    baseURL: `${API_BASE_URL}/api`,
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    },
  });
};

export interface UpdateProfileData {
  username?: string;
  email?: string;
  phoneNumber?: string;
  password?: string;
}

export interface NotificationPreferences {
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  meetingReminders?: boolean;
  auditReminders?: boolean;
}

export interface TestNotificationRequest {
  type: 'email' | 'sms' | 'both';
}

export interface TestNotificationResponse {
  success: boolean;
  data?: {
    results: {
      email?: boolean;
      sms?: boolean;
    };
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface UserProfileResponse {
  success: boolean;
  data?: {
    user: {
      id: string;
      username: string;
      email: string;
      phoneNumber: string;
      role: string;
      emailNotifications: boolean;
      smsNotifications: boolean;
      meetingReminders: boolean;
      auditReminders: boolean;
      createdAt: string;
      updatedAt: string;
    };
  };
  error?: {
    code: string;
    message: string;
  };
}

export class UserService {
  // Update user profile
  static async updateProfile(
    profileData: UpdateProfileData
  ): Promise<UserProfileResponse> {
    try {
      const api = createAuthenticatedRequest();
      const response = await api.put('/users/profile', profileData);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data;
      }
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Failed to update profile. Please check your connection.',
        },
      };
    }
  }

  // Update notification preferences
  static async updateNotificationPreferences(
    preferences: NotificationPreferences
  ): Promise<UserProfileResponse> {
    try {
      const api = createAuthenticatedRequest();
      const response = await api.put(
        '/users/notification-preferences',
        preferences
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data;
      }
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message:
            'Failed to update notification preferences. Please check your connection.',
        },
      };
    }
  }

  // Test notification functionality
  static async testNotification(
    request: TestNotificationRequest
  ): Promise<TestNotificationResponse> {
    try {
      const api = createAuthenticatedRequest();
      const response = await api.post('/users/test-notification', request);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data;
      }
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message:
            'Failed to send test notification. Please check your connection.',
        },
      };
    }
  }

  // Get current user profile (using existing auth endpoint)
  static async getCurrentProfile(): Promise<UserProfileResponse> {
    try {
      const api = createAuthenticatedRequest();
      const response = await api.get('/auth/profile');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data;
      }
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Failed to get profile. Please check your connection.',
        },
      };
    }
  }

  // Get all users (for audit assignment)
  static async getUsers(): Promise<{
    success: boolean;
    data?: Array<{
      id: string;
      username: string;
      email: string;
      role: string;
    }>;
    error?: {
      code: string;
      message: string;
    };
  }> {
    try {
      const api = createAuthenticatedRequest();
      const response = await api.get('/users');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data;
      }
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Failed to get users. Please check your connection.',
        },
      };
    }
  }
}
