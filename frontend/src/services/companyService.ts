import axios from 'axios';
import {
  CreateCompanyData,
  UpdateCompanyData,
  CompanyFilters,
  CompanyResponse,
} from '../types/company';
import { API_BASE_URL } from '../config/api';

const companyAPI = axios.create({
  baseURL: `${API_BASE_URL}/api/companies`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
companyAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const companyService = {
  async getCompanies(filters?: CompanyFilters): Promise<CompanyResponse> {
    try {
      const params = new URLSearchParams();
      if (filters?.tier) params.append('tier', filters.tier);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.offset) params.append('offset', filters.offset.toString());

      // Add cache-busting parameter to ensure fresh data
      params.append('_t', Date.now().toString());

      console.log('🔍 Fetching companies with params:', params.toString());
      const response = await companyAPI.get(`?${params.toString()}`);
      console.log('📋 Companies response:', response.data);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Failed to fetch companies. Please try again.',
        },
      };
    }
  },

  async getCompany(id: string): Promise<CompanyResponse> {
    try {
      const response = await companyAPI.get(`/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Failed to fetch company details. Please try again.',
        },
      };
    }
  },

  async createCompany(data: CreateCompanyData): Promise<CompanyResponse> {
    try {
      const response = await companyAPI.post('/', data);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Failed to create company. Please try again.',
        },
      };
    }
  },

  async updateCompany(
    id: string,
    data: UpdateCompanyData
  ): Promise<CompanyResponse> {
    try {
      const response = await companyAPI.put(`/${id}`, data);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Failed to update company. Please try again.',
        },
      };
    }
  },

  async deleteCompany(id: string): Promise<CompanyResponse> {
    try {
      const response = await companyAPI.delete(`/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Failed to delete company. Please try again.',
        },
      };
    }
  },

  async updatePaymentData(
    id: string,
    data: { lastPaymentDate: string; lastPaymentAmount: number }
  ): Promise<CompanyResponse> {
    try {
      const response = await companyAPI.put(`/${id}/payment`, data);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Failed to update payment data. Please try again.',
        },
      };
    }
  },

  async updateMeetingData(
    id: string,
    data: {
      lastMeetingDate: string;
      lastMeetingAttendees?: string[];
      lastMeetingDuration?: number;
    }
  ): Promise<CompanyResponse> {
    try {
      const response = await companyAPI.put(`/${id}/meeting`, data);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Failed to update meeting data. Please try again.',
        },
      };
    }
  },
};
