import axios from 'axios';
import {
  CreateAuditData,
  UpdateAuditData,
  AuditFilters,
  AuditResponse,
  AuditStatistics,
} from '../types/audit';
import { API_BASE_URL } from '../config/api';

const auditAPI = axios.create({
  baseURL: `${API_BASE_URL}/api/audits`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
auditAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const auditService = {
  async getAudits(filters?: AuditFilters): Promise<AuditResponse> {
    try {
      const params = new URLSearchParams();
      if (filters?.companyId) params.append('companyId', filters.companyId);
      if (filters?.assignedTo) params.append('assignedTo', filters.assignedTo);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.scheduledDateFrom)
        params.append('scheduledDateFrom', filters.scheduledDateFrom);
      if (filters?.scheduledDateTo)
        params.append('scheduledDateTo', filters.scheduledDateTo);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.offset) params.append('offset', filters.offset.toString());

      const response = await auditAPI.get(`?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Failed to fetch audits. Please try again.',
        },
      };
    }
  },

  async getAudit(id: string): Promise<AuditResponse> {
    try {
      const response = await auditAPI.get(`/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Failed to fetch audit details. Please try again.',
        },
      };
    }
  },

  async createAudit(data: CreateAuditData): Promise<AuditResponse> {
    try {
      const response = await auditAPI.post('/', data);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Failed to create audit. Please try again.',
        },
      };
    }
  },

  async updateAudit(id: string, data: UpdateAuditData): Promise<AuditResponse> {
    try {
      const response = await auditAPI.put(`/${id}`, data);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Failed to update audit. Please try again.',
        },
      };
    }
  },

  async deleteAudit(id: string): Promise<AuditResponse> {
    try {
      const response = await auditAPI.delete(`/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Failed to delete audit. Please try again.',
        },
      };
    }
  },

  async completeAudit(id: string, notes?: string): Promise<AuditResponse> {
    try {
      const response = await auditAPI.put(`/${id}/complete`, { notes });
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Failed to complete audit. Please try again.',
        },
      };
    }
  },

  async getCompanyAudits(companyId: string): Promise<AuditResponse> {
    try {
      const response = await auditAPI.get(`/company/${companyId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Failed to fetch company audits. Please try again.',
        },
      };
    }
  },

  async getUpcomingAudits(days: number = 7): Promise<AuditResponse> {
    try {
      const response = await auditAPI.get(`/upcoming?days=${days}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Failed to fetch upcoming audits. Please try again.',
        },
      };
    }
  },

  async getAuditStatistics(): Promise<{
    success: boolean;
    data?: AuditStatistics;
    error?: { code: string; message: string };
  }> {
    try {
      const response = await auditAPI.get('/statistics');
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Failed to fetch audit statistics. Please try again.',
        },
      };
    }
  },
};
