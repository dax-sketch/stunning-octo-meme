import { render } from '@testing-library/react';
import { UserProfile } from '../UserProfile';
import { NotificationSettings } from '../NotificationSettings';
import { useAuth } from '../../hooks/useAuth';

// Mock the services and hooks
jest.mock('../../services/userService');
jest.mock('../../hooks/useAuth');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

const mockUser = {
  id: 'user-123',
  username: 'testuser',
  email: 'test@example.com',
  phoneNumber: '+1234567890',
  role: 'TEAM_MEMBER' as const,
  emailNotifications: true,
  smsNotifications: true,
  meetingReminders: true,
  auditReminders: true,
  notificationPreferences: {
    email: true,
    sms: true,
    meetingReminders: true,
    auditReminders: true,
  },
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
};

describe('Basic Component Rendering', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: mockUser,
      token: 'mock-token',
      isAuthenticated: true,
      isLoading: false,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
    });
  });

  it('renders UserProfile without crashing', () => {
    render(<UserProfile />);
  });

  it('renders NotificationSettings without crashing', () => {
    render(<NotificationSettings />);
  });
});
