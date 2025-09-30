import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from '../ProtectedRoute';
import { AuthProvider } from '../../hooks/useAuth';
import { QueryClient, QueryClientProvider } from 'react-query';

// Mock the auth service
const mockAuthService = {
  getStoredToken: jest.fn(),
  getStoredUser: jest.fn(),
};

jest.mock('../../services/authService', () => ({
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
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>{children}</BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

describe('ProtectedRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading spinner when authentication is loading', () => {
    mockAuthService.getStoredToken.mockReturnValue(null);
    mockAuthService.getStoredUser.mockReturnValue(null);

    render(
      <TestWrapper>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </TestWrapper>
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders children when user is authenticated', async () => {
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
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </TestWrapper>
    );

    // Wait for auth to load and then check for content
    await screen.findByText('Protected Content');
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});
