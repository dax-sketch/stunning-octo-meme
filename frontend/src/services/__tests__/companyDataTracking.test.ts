import axios from 'axios';
import { companyService } from '../companyService';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock axios.create
const mockAxiosInstance = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  interceptors: {
    request: {
      use: jest.fn(),
    },
  },
};

mockedAxios.create.mockReturnValue(mockAxiosInstance as any);

describe('Company Service - Data Tracking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => 'mock-token'),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    });
  });

  describe('updatePaymentData', () => {
    it('should update payment data successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            id: 'company123',
            name: 'Test Company',
            lastPaymentDate: '2024-01-15T00:00:00.000Z',
            lastPaymentAmount: 5000,
          },
          message: 'Payment data updated successfully',
        },
      };

      mockAxiosInstance.put.mockResolvedValue(mockResponse);

      const result = await companyService.updatePaymentData('company123', {
        lastPaymentDate: '2024-01-15',
        lastPaymentAmount: 5000,
      });

      expect(mockAxiosInstance.put).toHaveBeenCalledWith(
        '/company123/payment',
        {
          lastPaymentDate: '2024-01-15',
          lastPaymentAmount: 5000,
        }
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle API error response', async () => {
      const mockErrorResponse = {
        response: {
          data: {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Payment amount must be positive',
            },
          },
        },
      };

      mockAxiosInstance.put.mockRejectedValue(mockErrorResponse);

      const result = await companyService.updatePaymentData('company123', {
        lastPaymentDate: '2024-01-15',
        lastPaymentAmount: -100,
      });

      expect(result).toEqual(mockErrorResponse.response.data);
    });

    it('should handle network error', async () => {
      mockAxiosInstance.put.mockRejectedValue(new Error('Network Error'));

      const result = await companyService.updatePaymentData('company123', {
        lastPaymentDate: '2024-01-15',
        lastPaymentAmount: 5000,
      });

      expect(result).toEqual({
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Failed to update payment data. Please try again.',
        },
      });
    });
  });

  describe('updateMeetingData', () => {
    it('should update meeting data successfully with all fields', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            id: 'company123',
            name: 'Test Company',
            lastMeetingDate: '2024-01-15T00:00:00.000Z',
            lastMeetingAttendees: ['John Doe', 'Jane Smith'],
            lastMeetingDuration: 60,
          },
          message: 'Meeting data updated successfully',
        },
      };

      mockAxiosInstance.put.mockResolvedValue(mockResponse);

      const result = await companyService.updateMeetingData('company123', {
        lastMeetingDate: '2024-01-15',
        lastMeetingAttendees: ['John Doe', 'Jane Smith'],
        lastMeetingDuration: 60,
      });

      expect(mockAxiosInstance.put).toHaveBeenCalledWith(
        '/company123/meeting',
        {
          lastMeetingDate: '2024-01-15',
          lastMeetingAttendees: ['John Doe', 'Jane Smith'],
          lastMeetingDuration: 60,
        }
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should update meeting data with only date', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            id: 'company123',
            name: 'Test Company',
            lastMeetingDate: '2024-01-15T00:00:00.000Z',
          },
          message: 'Meeting data updated successfully',
        },
      };

      mockAxiosInstance.put.mockResolvedValue(mockResponse);

      const result = await companyService.updateMeetingData('company123', {
        lastMeetingDate: '2024-01-15',
      });

      expect(mockAxiosInstance.put).toHaveBeenCalledWith(
        '/company123/meeting',
        {
          lastMeetingDate: '2024-01-15',
        }
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle API error response', async () => {
      const mockErrorResponse = {
        response: {
          data: {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Meeting date is required',
            },
          },
        },
      };

      mockAxiosInstance.put.mockRejectedValue(mockErrorResponse);

      const result = await companyService.updateMeetingData('company123', {
        lastMeetingDate: '',
      });

      expect(result).toEqual(mockErrorResponse.response.data);
    });

    it('should handle network error', async () => {
      mockAxiosInstance.put.mockRejectedValue(new Error('Network Error'));

      const result = await companyService.updateMeetingData('company123', {
        lastMeetingDate: '2024-01-15',
      });

      expect(result).toEqual({
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Failed to update meeting data. Please try again.',
        },
      });
    });
  });

  describe('API configuration', () => {
    it('should configure axios instance correctly', () => {
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'http://localhost:3001/api/companies',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });

    it('should add authorization header when token exists', () => {
      const mockRequestConfig = { headers: {} };
      const interceptorCallback =
        mockAxiosInstance.interceptors.request.use.mock.calls[0][0];

      const result = interceptorCallback(mockRequestConfig);

      expect(result.headers.Authorization).toBe('Bearer mock-token');
    });

    it('should not add authorization header when token does not exist', () => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue(null);

      const mockRequestConfig = { headers: {} };
      const interceptorCallback =
        mockAxiosInstance.interceptors.request.use.mock.calls[0][0];

      const result = interceptorCallback(mockRequestConfig);

      expect(result.headers.Authorization).toBeUndefined();
    });
  });
});
