import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegisterForm } from '../RegisterForm';
import { AuthProvider } from '../../hooks/useAuth';
import { QueryClient, QueryClientProvider } from 'react-query';

// Mock the auth service
jest.mock('../../services/authService', () => ({
  authService: {
    register: jest.fn(),
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

describe('RegisterForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders register form with all required fields', () => {
    render(
      <TestWrapper>
        <RegisterForm />
      </TestWrapper>
    );

    expect(
      screen.getByRole('heading', { name: /register/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /register/i })
    ).toBeInTheDocument();
  });

  it('shows validation errors for empty fields', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <RegisterForm />
      </TestWrapper>
    );

    const registerButton = screen.getByRole('button', { name: /register/i });
    await user.click(registerButton);
    await waitFor(() => {
      expect(screen.getByText('Username is required')).toBeInTheDocument();
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('Phone number is required')).toBeInTheDocument();
      expect(screen.getByText('Password is required')).toBeInTheDocument();
      expect(
        screen.getByText('Please confirm your password')
      ).toBeInTheDocument();
    });
  });

  it('validates email format', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <RegisterForm />
      </TestWrapper>
    );

    const emailField = screen.getByLabelText(/email address/i);
    await user.type(emailField, 'invalid-email');

    const registerButton = screen.getByRole('button', { name: /register/i });
    await user.click(registerButton);

    await waitFor(() => {
      expect(
        screen.getByText('Please enter a valid email address')
      ).toBeInTheDocument();
    });
  });

  it('validates password confirmation match', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <RegisterForm />
      </TestWrapper>
    );

    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'different');

    const registerButton = screen.getByRole('button', { name: /register/i });
    await user.click(registerButton);

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
  });

  it('calls onSwitchToLogin when login link is clicked', async () => {
    const user = userEvent.setup();
    const mockOnSwitchToLogin = jest.fn();

    render(
      <TestWrapper>
        <RegisterForm onSwitchToLogin={mockOnSwitchToLogin} />
      </TestWrapper>
    );

    const loginLink = screen.getByText(/already have an account\? login here/i);
    await user.click(loginLink);

    expect(mockOnSwitchToLogin).toHaveBeenCalledTimes(1);
  });
});
