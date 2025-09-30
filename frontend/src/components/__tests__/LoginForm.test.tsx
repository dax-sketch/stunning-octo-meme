import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '../LoginForm';
import { AuthProvider } from '../../hooks/useAuth';
import { QueryClient, QueryClientProvider } from 'react-query';

// Mock the auth service
jest.mock('../../services/authService', () => ({
  authService: {
    login: jest.fn(),
    getStoredToken: jest.fn(() => null),
    getStoredUser: jest.fn(() => null),
  },
}));

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
};

describe('LoginForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders login form with all required fields', () => {
    render(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
    );

    expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('shows validation errors for empty fields', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
    );

    const loginButton = screen.getByRole('button', { name: /login/i });
    await user.click(loginButton);

    await waitFor(() => {
      expect(screen.getByText('Username is required')).toBeInTheDocument();
      expect(screen.getByText('Password is required')).toBeInTheDocument();
    });
  });

  it('clears validation errors when user starts typing', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
    );

    // Trigger validation errors
    const loginButton = screen.getByRole('button', { name: /login/i });
    await user.click(loginButton);

    await waitFor(() => {
      expect(screen.getByText('Username is required')).toBeInTheDocument();
    });

    // Start typing in username field
    const usernameField = screen.getByLabelText(/username/i);
    await user.type(usernameField, 'testuser');

    await waitFor(() => {
      expect(
        screen.queryByText('Username is required')
      ).not.toBeInTheDocument();
    });
  });

  it('calls onSwitchToRegister when register link is clicked', async () => {
    const user = userEvent.setup();
    const mockOnSwitchToRegister = jest.fn();

    render(
      <TestWrapper>
        <LoginForm onSwitchToRegister={mockOnSwitchToRegister} />
      </TestWrapper>
    );

    const registerLink = screen.getByText(
      /don't have an account\? register here/i
    );
    await user.click(registerLink);

    expect(mockOnSwitchToRegister).toHaveBeenCalledTimes(1);
  });

  it('disables form during loading state', async () => {
    const { authService } = require('../../services/authService');
    authService.login.mockImplementation(() => new Promise(() => {})); // Never resolves

    const user = userEvent.setup();

    render(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
    );

    // Fill in form
    await user.type(screen.getByLabelText(/username/i), 'testuser');
    await user.type(screen.getByLabelText(/password/i), 'password123');

    // Submit form
    const loginButton = screen.getByRole('button', { name: /login/i });
    await user.click(loginButton);

    // Check that button is disabled and shows loading
    await waitFor(() => {
      expect(loginButton).toBeDisabled();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });
});
