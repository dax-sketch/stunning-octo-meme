import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { BrowserRouter } from 'react-router-dom';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { LoginForm } from '../components/LoginForm';
import { useFormValidation } from '../hooks/useFormValidation';
import { AuthProvider } from '../hooks/useAuth';
import apiClient, { isApiError, getErrorMessage } from '../services/apiClient';

// Mock API client
jest.mock('../services/apiClient');
const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

// Test component that uses form validation
const TestFormComponent: React.FC = () => {
  const { values, errors, touched, setValue, touchField, handleSubmit } =
    useFormValidation(
      { email: '', password: '' },
      {
        email: { required: true, email: true },
        password: { required: true, minLength: 8 },
      }
    );

  const onSubmit = async (data: any) => {
    // Simulate API call
    throw new Error('Submission failed');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        data-testid="email-input"
        value={values.email}
        onChange={(e) => setValue('email', e.target.value)}
        onBlur={() => touchField('email')}
      />
      {touched.email && errors.email && (
        <div data-testid="email-error">{errors.email}</div>
      )}

      <input
        data-testid="password-input"
        type="password"
        value={values.password}
        onChange={(e) => setValue('password', e.target.value)}
        onBlur={() => touchField('password')}
      />
      {touched.password && errors.password && (
        <div data-testid="password-error">{errors.password}</div>
      )}

      <button type="submit">Submit</button>
    </form>
  );
};

// Component that throws an error for testing error boundary
const ErrorThrowingComponent: React.FC<{ shouldThrow?: boolean }> = ({
  shouldThrow = false,
}) => {
  if (shouldThrow) {
    throw new Error('Test component error');
  }
  return <div>Component rendered successfully</div>;
};

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>{children}</AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Error Handling Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console.error to avoid noise in test output
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Form Validation Integration', () => {
    it('should validate form fields in real-time', async () => {
      render(
        <TestWrapper>
          <TestFormComponent />
        </TestWrapper>
      );

      const emailInput = screen.getByTestId('email-input');
      const passwordInput = screen.getByTestId('password-input');

      // Test email validation
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toHaveTextContent(
          'Please enter a valid email address'
        );
      });

      // Test password validation
      fireEvent.change(passwordInput, { target: { value: 'short' } });
      fireEvent.blur(passwordInput);

      await waitFor(() => {
        expect(screen.getByTestId('password-error')).toHaveTextContent(
          'password must be at least 8 characters'
        );
      });

      // Test valid input clears errors
      fireEvent.change(emailInput, { target: { value: 'valid@example.com' } });

      await waitFor(() => {
        expect(screen.queryByTestId('email-error')).not.toBeInTheDocument();
      });
    });

    it('should prevent form submission with validation errors', async () => {
      render(
        <TestWrapper>
          <TestFormComponent />
        </TestWrapper>
      );

      const submitButton = screen.getByText('Submit');

      // Try to submit empty form
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toHaveTextContent(
          'email is required'
        );
        expect(screen.getByTestId('password-error')).toHaveTextContent(
          'password is required'
        );
      });
    });
  });

  describe('Error Boundary Integration', () => {
    it('should catch and display component errors', () => {
      render(
        <ErrorBoundary>
          <ErrorThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(
        screen.getByText('Oops! Something went wrong')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Error: Test component error')
      ).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
      expect(screen.getByText('Reload Page')).toBeInTheDocument();
    });

    it('should allow error recovery', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ErrorThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(
        screen.getByText('Oops! Something went wrong')
      ).toBeInTheDocument();

      // Click try again
      fireEvent.click(screen.getByText('Try Again'));

      // Re-render without error
      rerender(
        <ErrorBoundary>
          <ErrorThrowingComponent shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(
        screen.getByText('Component rendered successfully')
      ).toBeInTheDocument();
    });
  });

  describe('API Error Handling Integration', () => {
    it('should handle API errors in login form', async () => {
      // Mock API error response
      mockedApiClient.post.mockRejectedValue({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid username or password',
        },
      });

      render(
        <TestWrapper>
          <LoginForm />
        </TestWrapper>
      );

      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /login/i });

      // Fill form with valid data
      fireEvent.change(usernameInput, { target: { value: 'testuser' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      // Submit form
      fireEvent.click(submitButton);

      // Should display API error
      await waitFor(() => {
        expect(
          screen.getByText('Invalid username or password')
        ).toBeInTheDocument();
      });
    });
  });

  describe('Error Utility Functions', () => {
    it('should correctly identify and extract error information', () => {
      const apiError = {
        success: false,
        error: {
          code: 'TEST_ERROR',
          message: 'Test error message',
        },
      };

      const regularError = new Error('Regular error message');
      const stringError = 'String error';

      expect(isApiError(apiError)).toBe(true);
      expect(isApiError(regularError)).toBe(false);
      expect(isApiError(stringError)).toBe(false);

      expect(getErrorMessage(apiError)).toBe('Test error message');
      expect(getErrorMessage(regularError)).toBe('Regular error message');
      expect(getErrorMessage(stringError)).toBe('String error');
      expect(getErrorMessage(null)).toBe('An unexpected error occurred');
    });
  });

  describe('Nested Error Boundaries', () => {
    it('should handle errors at different component levels', () => {
      render(
        <ErrorBoundary>
          <div>
            <h1>App Level</h1>
            <ErrorBoundary>
              <div>
                <h2>Component Level</h2>
                <ErrorThrowingComponent shouldThrow={true} />
              </div>
            </ErrorBoundary>
          </div>
        </ErrorBoundary>
      );

      // Should show error boundary UI but app level should still be visible
      expect(screen.getByText('App Level')).toBeInTheDocument();
      expect(
        screen.getByText('Oops! Something went wrong')
      ).toBeInTheDocument();
    });
  });

  describe('Error Recovery Scenarios', () => {
    it('should handle multiple error and recovery cycles', () => {
      let shouldThrow = true;

      const ToggleErrorComponent: React.FC = () => {
        return (
          <div>
            <button
              onClick={() => {
                shouldThrow = !shouldThrow;
              }}
            >
              Toggle Error
            </button>
            <ErrorThrowingComponent shouldThrow={shouldThrow} />
          </div>
        );
      };

      const { rerender } = render(
        <ErrorBoundary>
          <ToggleErrorComponent />
        </ErrorBoundary>
      );

      // Should show error initially
      expect(
        screen.getByText('Oops! Something went wrong')
      ).toBeInTheDocument();

      // Reset error boundary
      fireEvent.click(screen.getByText('Try Again'));

      // Re-render with error disabled
      shouldThrow = false;
      rerender(
        <ErrorBoundary>
          <ToggleErrorComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('Toggle Error')).toBeInTheDocument();
    });
  });
});
