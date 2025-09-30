import axios, { AxiosInstance, AxiosError, AxiosResponse } from 'axios';
import { API_BASE_URL } from '../config/api';

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp?: string;
}

export interface ApiResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}

// Extend AxiosRequestConfig to include retry flag
declare module 'axios' {
  interface AxiosRequestConfig {
    _retry?: boolean;
  }
}

// Create axios instance with base configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config;
    const apiError = handleApiError(error);

    // Handle authentication errors (token expired or invalid)
    if (
      apiError.error.code === 'AUTHENTICATION_FAILED' ||
      apiError.error.code === 'TOKEN_EXPIRED' ||
      apiError.error.code === 'INVALID_TOKEN' ||
      (error.response?.status === 401 &&
        apiError.error.message?.includes('expired'))
    ) {
      const refreshToken = localStorage.getItem('refreshToken');

      // Try to refresh token if we have a refresh token and haven't already tried
      if (refreshToken && originalRequest && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const response = await axios.post(
            `${API_BASE_URL}/api/auth/refresh`,
            { refreshToken }
          );

          if (response.data.success) {
            const { accessToken, refreshToken: newRefreshToken } =
              response.data.data.tokens;

            // Update stored tokens
            localStorage.setItem('token', accessToken);
            if (newRefreshToken) {
              localStorage.setItem('refreshToken', newRefreshToken);
            }

            // Retry the original request with new token
            if (originalRequest) {
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
              return apiClient(originalRequest);
            }
          }
        } catch (refreshError: any) {
          // Refresh failed, show user-friendly dialog
          const { showGlobalTokenExpirationDialog } = await import(
            '../hooks/useTokenExpiration'
          );
          showGlobalTokenExpirationDialog();

          return Promise.reject(apiError);
        }
      } else {
        // No refresh token or refresh already failed, show user-friendly dialog
        const { showGlobalTokenExpirationDialog } = await import(
          '../hooks/useTokenExpiration'
        );
        showGlobalTokenExpirationDialog();
      }
    }

    return Promise.reject(apiError);
  }
);

// Error handler function
function handleApiError(error: AxiosError): ApiError {
  // Network error (no response)
  if (!error.response) {
    if (error.code === 'ECONNABORTED') {
      return {
        success: false,
        error: {
          code: 'TIMEOUT',
          message:
            'Request timed out. Please check your connection and try again.',
        },
      };
    }

    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message:
          'Unable to connect to the server. Please check your internet connection.',
      },
    };
  }

  // Server responded with error status
  const { status, data } = error.response;

  // If server returned structured error response
  if (data && typeof data === 'object' && 'error' in data) {
    const errorData = data as {
      error: {
        code?: string;
        message?: string;
        details?: any;
      };
      timestamp?: string;
    };

    return {
      success: false,
      error: {
        code: errorData.error.code || `HTTP_${status}`,
        message: errorData.error.message || getDefaultErrorMessage(status),
        details: errorData.error.details,
      },
      timestamp: errorData.timestamp,
    };
  }

  // Fallback error handling
  return {
    success: false,
    error: {
      code: `HTTP_${status}`,
      message: getDefaultErrorMessage(status),
      details: data,
    },
  };
}

// Get user-friendly error messages for HTTP status codes
function getDefaultErrorMessage(status: number): string {
  switch (status) {
    case 400:
      return 'Invalid request. Please check your input and try again.';
    case 401:
      return 'You are not authorized. Please log in and try again.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return 'The requested resource was not found.';
    case 409:
      return 'This action conflicts with existing data.';
    case 422:
      return 'The provided data is invalid.';
    case 429:
      return 'Too many requests. Please wait a moment and try again.';
    case 500:
      return 'An internal server error occurred. Please try again later.';
    case 502:
      return 'Server is temporarily unavailable. Please try again later.';
    case 503:
      return 'Service is temporarily unavailable. Please try again later.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
}

// Utility function to check if error is an API error
export function isApiError(error: any): error is ApiError {
  return (
    error && typeof error === 'object' && error.success === false && error.error
  );
}

// Utility function to get error message from any error type
export function getErrorMessage(error: any): string {
  if (isApiError(error)) {
    return error.error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'An unexpected error occurred';
}

// Utility function to get error code from any error type
export function getErrorCode(error: any): string {
  if (isApiError(error)) {
    return error.error.code;
  }

  return 'UNKNOWN_ERROR';
}

export default apiClient;
