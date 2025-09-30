import axios from 'axios';
import {
  DashboardMetrics,
  AuditStatistics,
  UpcomingAudit,
} from '../types/dashboard';
import { Company } from '../types/company';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const dashboardAPI = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
dashboardAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const dashboardService = {
  async getDashboardMetrics(): Promise<{
    success: boolean;
    data?: DashboardMetrics;
    error?: any;
  }> {
    try {
      // Get all companies to calculate metrics
      const companiesResponse = await dashboardAPI.get('/companies');

      if (!companiesResponse.data.success) {
        return companiesResponse.data;
      }

      const companies: Company[] = companiesResponse.data.data;

      // Calculate metrics from companies data
      const totalCompanies = companies.length;
      const companiesByTier = companies.reduce(
        (acc, company) => {
          acc[company.tier] = (acc[company.tier] || 0) + 1;
          return acc;
        },
        { TIER_1: 0, TIER_2: 0, TIER_3: 0 }
      );

      // Calculate recent payments (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentPayments = companies.filter(
        (company) =>
          company.lastPaymentDate &&
          new Date(company.lastPaymentDate) >= thirtyDaysAgo
      ).length;

      // Calculate upcoming meetings from the meetings API
      let upcomingMeetings = 0;
      try {
        const meetingsResponse = await dashboardAPI.get(
          '/meetings/upcoming?days=30'
        );
        if (meetingsResponse.data.success && meetingsResponse.data.data) {
          upcomingMeetings = Array.isArray(meetingsResponse.data.data)
            ? meetingsResponse.data.data.length
            : 0;
        }
      } catch (error) {
        console.error('Failed to fetch upcoming meetings for metrics:', error);
        // Fall back to 0 if meetings API fails
        upcomingMeetings = 0;
      }

      const metrics: DashboardMetrics = {
        totalCompanies,
        companiesByTier,
        recentPayments,
        upcomingMeetings,
      };

      return {
        success: true,
        data: metrics,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Failed to fetch dashboard metrics. Please try again.',
        },
      };
    }
  },

  async getAuditStatistics(): Promise<{
    success: boolean;
    data?: AuditStatistics;
    error?: any;
  }> {
    try {
      const response = await dashboardAPI.get('/audits/statistics');
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

  async getUpcomingAudits(
    days: number = 7
  ): Promise<{ success: boolean; data?: UpcomingAudit[]; error?: any }> {
    try {
      console.log(`🔍 Fetching upcoming audits for ${days} days...`);
      const response = await dashboardAPI.get(`/audits/upcoming?days=${days}`);
      console.log('📋 Upcoming audits response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error(
        '❌ Error fetching upcoming audits:',
        error.response?.data || error.message
      );
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

  // Alias for getDashboardMetrics to match hook expectations
  getDashboardData: async function () {
    return this.getDashboardMetrics();
  },

  // Alias for getDashboardMetrics to match hook expectations
  getStats: async function () {
    return this.getDashboardMetrics();
  },
};
