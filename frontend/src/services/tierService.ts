import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const tierAPI = axios.create({
  baseURL: `${API_BASE_URL}/api/tiers`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
tierAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface CompanyNeedingReview {
  $id: string;
  name: string;
  tier: string;
  suggestedTier: string;
  reason: string;
}

export interface TierStatistics {
  distribution: Record<string, number>;
  recentChanges: number;
  totalCompanies: number;
}

export interface TierChangeLog {
  $id: string;
  companyId: string;
  oldTier: string;
  newTier: string;
  reason: string;
  changedBy?: string;
  notes?: string;
  createdAt: string;
  company?: {
    $id: string;
    name: string;
  };
  changedByUser?: {
    $id: string;
    username: string;
  };
}

export interface TierResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  message?: string;
}

export const tierService = {
  async getCompaniesNeedingReview(): Promise<
    TierResponse<CompanyNeedingReview[]>
  > {
    try {
      const response = await tierAPI.get('/review');
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
            'Failed to fetch companies needing review. Please try again.',
        },
      };
    }
  },

  async approveTierChange(
    companyId: string,
    newTier: string
  ): Promise<TierResponse> {
    try {
      const response = await tierAPI.post('/approve', {
        companyId,
        newTier,
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Failed to approve tier change. Please try again.',
        },
      };
    }
  },

  async overrideTier(
    companyId: string,
    newTier: string,
    reason?: string
  ): Promise<TierResponse> {
    try {
      const response = await tierAPI.post(`/companies/${companyId}/override`, {
        newTier,
        reason,
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Failed to override tier. Please try again.',
        },
      };
    }
  },

  async getTierStatistics(): Promise<TierResponse<TierStatistics>> {
    try {
      const response = await tierAPI.get('/statistics');
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Failed to fetch tier statistics. Please try again.',
        },
      };
    }
  },

  async getTierHistory(
    companyId: string
  ): Promise<TierResponse<TierChangeLog[]>> {
    try {
      const response = await tierAPI.get(`/companies/${companyId}/history`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Failed to fetch tier history. Please try again.',
        },
      };
    }
  },

  async canOverrideTiers(): Promise<TierResponse<{ canOverride: boolean }>> {
    try {
      const response = await tierAPI.get('/can-override');
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Failed to check permissions. Please try again.',
        },
      };
    }
  },

  async updateAllTiers(): Promise<TierResponse> {
    try {
      const response = await tierAPI.post('/update-all');
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Failed to update all tiers. Please try again.',
        },
      };
    }
  },
};
