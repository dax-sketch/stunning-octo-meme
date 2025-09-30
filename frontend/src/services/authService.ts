import apiClient, { isApiError } from './apiClient';
import { LoginCredentials, RegisterData, AuthResponse } from '../types/auth';

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await apiClient.post('/auth/login', credentials);
      return response.data;
    } catch (error: any) {
      if (isApiError(error)) {
        return error;
      }
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Network error occurred. Please try again.',
        },
      };
    }
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      // Transform frontend data to backend format
      const backendData = {
        username: data.username,
        email: data.email,
        phoneNumber: data.phoneNumber,
        password: data.password,
        role: 'TEAM_MEMBER', // Default role
      };

      const response = await apiClient.post('/auth/register', backendData);
      return response.data;
    } catch (error: any) {
      if (isApiError(error)) {
        return error;
      }
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Network error occurred. Please try again.',
        },
      };
    }
  },

  async logout(): Promise<void> {
    try {
      await apiClient.delete('/auth/logout');
    } catch (error) {
      // Logout should work even if API call fails
      console.warn('Logout API call failed, but continuing with local logout');
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  },

  getStoredToken(): string | null {
    return localStorage.getItem('token');
  },

  getStoredUser(): any | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;

    const user = JSON.parse(userStr);
    // Ensure notification preferences are properly mapped
    if (user && !user.notificationPreferences) {
      user.notificationPreferences = {
        email: user.emailNotifications ?? true,
        sms: user.smsNotifications ?? true,
        meetingReminders: user.meetingReminders ?? true,
        auditReminders: user.auditReminders ?? true,
      };
    }
    return user;
  },

  storeAuthData(token: string, user: any, refreshToken?: string): void {
    // Map backend user format to frontend format
    const mappedUser = {
      ...user,
      notificationPreferences: {
        email: user.emailNotifications ?? true,
        sms: user.smsNotifications ?? true,
        meetingReminders: user.meetingReminders ?? true,
        auditReminders: user.auditReminders ?? true,
      },
    };
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(mappedUser));
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
  },
};
