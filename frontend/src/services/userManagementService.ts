import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const userManagementAPI = axios.create({
  baseURL: `${API_BASE_URL}/api/user-management`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
userManagementAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface CreateUserData {
  email: string;
  password: string;
  username: string;
  role: 'CEO' | 'MANAGER' | 'TEAM_MEMBER';
}

export interface User {
  id: string;
  email: string;
  username: string;
  role: string;
  createdAt: string;
  updatedAt?: string;
}

export interface UserManagementResponse {
  success: boolean;
  data?: User | User[];
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export const userManagementService = {
  async createUser(data: CreateUserData): Promise<UserManagementResponse> {
    try {
      console.log('🔍 Creating user:', { ...data, password: '[HIDDEN]' });
      const response = await userManagementAPI.post('/', data);
      console.log('✅ User created:', response.data);
      return response.data;
    } catch (error: any) {
      console.error(
        '❌ Error creating user:',
        error.response?.data || error.message
      );
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Failed to create user. Please try again.',
        },
      };
    }
  },

  async getAllUsers(): Promise<UserManagementResponse> {
    try {
      const response = await userManagementAPI.get('/');
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Failed to fetch users. Please try again.',
        },
      };
    }
  },

  async deleteUser(id: string): Promise<UserManagementResponse> {
    try {
      const response = await userManagementAPI.delete(`/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Failed to delete user. Please try again.',
        },
      };
    }
  },
};
