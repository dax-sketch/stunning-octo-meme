import axios from 'axios';
import apiClient, {
  isApiError,
  getErrorMessage,
  getErrorCode,
} from '../apiClient';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock window.location
const mockLocation = {
  href: '',
  pathname: '/',
};
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

describe('apiClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    mockLocation.href = '';
    mockLocation.pathname = '/';
  });

  describe('Request Interceptor', () => {
    it('should add authorization header when token exists', () => {
      const token = 'test-token';
      localStorageMock.getItem.mockReturnValue(token);

      // Create a mock config object
      const config = {
        headers: {},
      };

      // Get the request interceptor
      const requestInterceptor = (apiClient as any).interceptors.request
        .handlers[0].fulfilled;
      const result = requestInterceptor(config);

      expect(result.headers.Authorization).toBe(`Bearer ${token}`);
    });

    it('should not add authorization header when no token exists', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const config = {
        headers: {},
      };

      const requestInterceptor = (apiClient as any).interceptors.request
        .handlers[0].fulfilled;
      const result = requestInterceptor(config);

      expect(result.headers.Authorization).toBeUndefined();
    });
  });

  describe('Response Interceptor', () => {
    it('should handle successful responses', () => {
      const response = { data: { success: true } };

      const responseInterceptor = (apiClient as any).interceptors.response
        .handlers[0].fulfilled;
      const result = responseInterceptor(response);

      expect(result).toBe(response);
    });

    it('should handle network errors', () => {
      const error = {
        code: 'ECONNABORTED',
        response: undefined,
      };

      const responseInterceptor = (apiClient as any).interceptors.response
        .handlers[0].rejected;

      expect(() => responseInterceptor(error)).rejects.toEqual({
        success: false,
        error: {
          code: 'TIMEOUT',
          message:
            'Request timed out. Please check your connection and try again.',
        },
      });
    });

    it('should handle server errors with structured response', () => {
      const error = {
        response: {
          status: 400,
          data: {
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid input',
              details: ['Field is required'],
            },
            timestamp: '2023-01-01T00:00:00Z',
          },
        },
      };

      const responseInterceptor = (apiClient as any).interceptors.response
        .handlers[0].rejected;

      expect(() => responseInterceptor(error)).rejects.toEqual({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: ['Field is required'],
        },
        timestamp: '2023-01-01T00:00:00Z',
      });
    });

    it('should handle token expiration', () => {
      const error = {
        response: {
          status: 401,
          data: {
            error: {
              code: 'TOKEN_EXPIRED',
              message: 'Token has expired',
            },
          },
        },
      };

      const responseInterceptor = (apiClient as any).interceptors.response
        .handlers[0].rejected;

      responseInterceptor(error).catch(() => {
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
      });
    });

    it('should redirect to login on token expiration when not on login page', () => {
      mockLocation.pathname = '/dashboard';

      const error = {
        response: {
          status: 401,
          data: {
            error: {
              code: 'TOKEN_EXPIRED',
              message: 'Token has expired',
            },
          },
        },
      };

      const responseInterceptor = (apiClient as any).interceptors.response
        .handlers[0].rejected;

      responseInterceptor(error).catch(() => {
        expect(mockLocation.href).toBe('/login');
      });
    });

    it('should not redirect when already on login page', () => {
      mockLocation.pathname = '/login';

      const error = {
        response: {
          status: 401,
          data: {
            error: {
              code: 'TOKEN_EXPIRED',
              message: 'Token has expired',
            },
          },
        },
      };

      const responseInterceptor = (apiClient as any).interceptors.response
        .handlers[0].rejected;

      responseInterceptor(error).catch(() => {
        expect(mockLocation.href).toBe('');
      });
    });
  });

  describe('Error Utility Functions', () => {
    describe('isApiError', () => {
      it('should identify API errors correctly', () => {
        const apiError = {
          success: false,
          error: {
            code: 'TEST_ERROR',
            message: 'Test message',
          },
        };

        expect(isApiError(apiError)).toBe(true);
      });

      it('should reject non-API errors', () => {
        const regularError = new Error('Regular error');
        const invalidObject = { success: true };
        const nullValue = null;

        expect(isApiError(regularError)).toBe(false);
        expect(isApiError(invalidObject)).toBe(false);
        expect(isApiError(nullValue)).toBe(false);
      });
    });

    describe('getErrorMessage', () => {
      it('should extract message from API error', () => {
        const apiError = {
          success: false,
          error: {
            code: 'TEST_ERROR',
            message: 'API error message',
          },
        };

        expect(getErrorMessage(apiError)).toBe('API error message');
      });

      it('should extract message from Error object', () => {
        const error = new Error('Error object message');
        expect(getErrorMessage(error)).toBe('Error object message');
      });

      it('should return string errors as-is', () => {
        expect(getErrorMessage('String error')).toBe('String error');
      });

      it('should return default message for unknown errors', () => {
        expect(getErrorMessage({})).toBe('An unexpected error occurred');
        expect(getErrorMessage(null)).toBe('An unexpected error occurred');
      });
    });

    describe('getErrorCode', () => {
      it('should extract code from API error', () => {
        const apiError = {
          success: false,
          error: {
            code: 'TEST_ERROR',
            message: 'Test message',
          },
        };

        expect(getErrorCode(apiError)).toBe('TEST_ERROR');
      });

      it('should return default code for non-API errors', () => {
        const error = new Error('Test error');
        expect(getErrorCode(error)).toBe('UNKNOWN_ERROR');
        expect(getErrorCode('string error')).toBe('UNKNOWN_ERROR');
        expect(getErrorCode(null)).toBe('UNKNOWN_ERROR');
      });
    });
  });

  describe('Default Error Messages', () => {
    const testCases = [
      {
        status: 400,
        expectedMessage:
          'Invalid request. Please check your input and try again.',
      },
      {
        status: 401,
        expectedMessage: 'You are not authorized. Please log in and try again.',
      },
      {
        status: 403,
        expectedMessage: 'You do not have permission to perform this action.',
      },
      { status: 404, expectedMessage: 'The requested resource was not found.' },
      {
        status: 409,
        expectedMessage: 'This action conflicts with existing data.',
      },
      { status: 422, expectedMessage: 'The provided data is invalid.' },
      {
        status: 429,
        expectedMessage:
          'Too many requests. Please wait a moment and try again.',
      },
      {
        status: 500,
        expectedMessage:
          'An internal server error occurred. Please try again later.',
      },
      {
        status: 502,
        expectedMessage:
          'Server is temporarily unavailable. Please try again later.',
      },
      {
        status: 503,
        expectedMessage:
          'Service is temporarily unavailable. Please try again later.',
      },
      {
        status: 999,
        expectedMessage: 'An unexpected error occurred. Please try again.',
      },
    ];

    testCases.forEach(({ status, expectedMessage }) => {
      it(`should return correct default message for status ${status}`, () => {
        const error = {
          response: {
            status,
            data: 'Some error data',
          },
        };

        const responseInterceptor = (apiClient as any).interceptors.response
          .handlers[0].rejected;

        expect(() => responseInterceptor(error)).rejects.toEqual({
          success: false,
          error: {
            code: `HTTP_${status}`,
            message: expectedMessage,
            details: 'Some error data',
          },
        });
      });
    });
  });
});
