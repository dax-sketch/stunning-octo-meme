import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import App from '../App';

// Mock the auth service
const mockAuthService = {
  login: jest.fn(),
  register: jest.fn(),
  logout: jest.fn(),
  getStoredToken: jest.fn(() => null),
  getStoredUser: jest.fn(() => null),
  storeAuthData: jest.fn(),
};

jest.mock('../services/authService', () => ({
  authService: mockAuthService,
}));

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('Authentication Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => null),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });
  });

  it('redirects unauthenticated users to login page', async () => {
    mockAuthService.getStoredToken.mockReturnValue(null);
    mockAuthService.getStoredUser.mockReturnValue(null);

    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    );

    // Should redirect to login page
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /login/i })
      ).toBeInTheDocument();
    });
  });

  it('shows dashboard for authenticated users', async () => {
    const mockUser = {
      id: '1',
      username: 'testuser',
      email: 'test@example.com',
      phoneNumber: '+1234567890',
      role: 'TEAM_MEMBER' as const,
      notificationPreferences: {
        email: true,
        sms: false,
        meetingReminders: true,
        auditReminders: true,
      },
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
    };

    mockAuthService.getStoredToken.mockReturnValue('valid-token');
    mockAuthService.getStoredUser.mockReturnValue(mockUser);

    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    );

    // Should show dashboard
    await waitFor(() => {
      expect(screen.getByText(/welcome, testuser!/i)).toBeInTheDocument();
    });
  });
});
