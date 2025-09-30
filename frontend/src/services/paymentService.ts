import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const paymentAPI = axios.create({
  baseURL: `${API_BASE_URL}/api/payments`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
paymentAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface CreatePaymentData {
  companyId: string;
  amount: number;
  paymentDate: Date;
  notes?: string;
}

export interface Payment {
  id: string;
  companyId: string;
  companyName: string;
  amount: number;
  paymentDate: string;
  createdBy: string;
  createdByUsername?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentResponse {
  success: boolean;
  data?: Payment | Payment[];
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export const paymentService = {
  async createPayment(data: CreatePaymentData): Promise<PaymentResponse> {
    try {
      console.log('🔍 Creating payment:', data);
      const response = await paymentAPI.post('/', {
        ...data,
        paymentDate: data.paymentDate.toISOString(),
      });
      console.log('✅ Payment created:', response.data);
      return response.data;
    } catch (error: any) {
      console.error(
        '❌ Error creating payment:',
        error.response?.data || error.message
      );
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Failed to create payment. Please try again.',
        },
      };
    }
  },

  async getPayments(filters?: {
    companyId?: string;
    paymentDateFrom?: Date;
    paymentDateTo?: Date;
    limit?: number;
    offset?: number;
  }): Promise<PaymentResponse> {
    try {
      const params = new URLSearchParams();

      if (filters?.companyId) params.append('companyId', filters.companyId);
      if (filters?.paymentDateFrom)
        params.append('paymentDateFrom', filters.paymentDateFrom.toISOString());
      if (filters?.paymentDateTo)
        params.append('paymentDateTo', filters.paymentDateTo.toISOString());
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.offset) params.append('offset', filters.offset.toString());

      const response = await paymentAPI.get(`/?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Failed to fetch payments. Please try again.',
        },
      };
    }
  },

  async getRecentPayments(days: number = 30): Promise<PaymentResponse> {
    try {
      const response = await paymentAPI.get(`/recent?days=${days}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Failed to fetch recent payments. Please try again.',
        },
      };
    }
  },

  async getPaymentById(id: string): Promise<PaymentResponse> {
    try {
      const response = await paymentAPI.get(`/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Failed to fetch payment. Please try again.',
        },
      };
    }
  },

  async updatePayment(
    id: string,
    data: Partial<CreatePaymentData>
  ): Promise<PaymentResponse> {
    try {
      const updateData = { ...data };
      if (updateData.paymentDate) {
        updateData.paymentDate = updateData.paymentDate.toISOString() as any;
      }

      const response = await paymentAPI.put(`/${id}`, updateData);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Failed to update payment. Please try again.',
        },
      };
    }
  },

  async deletePayment(id: string): Promise<PaymentResponse> {
    try {
      const response = await paymentAPI.delete(`/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Failed to delete payment. Please try again.',
        },
      };
    }
  },
};
