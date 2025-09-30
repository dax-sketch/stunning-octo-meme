import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserSettingsPage } from '../../pages/UserSettingsPage';
import { UserService } from '../../services/userService';
import { useAuth } from '../../hooks/useAuth';
import { BrowserRouter } from 'react-router-dom';

// Mock the services and hooks
jest.mock('../../services/userService');
jest.mock('../../hooks/useAuth');

const mockUserService = UserService as jest.Mocked<typeof UserService>;
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

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('UserSettingsPage Integration', () => {
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

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders both user profile and notification settings', () => {
    renderWithRouter(<UserSettingsPage />);

    expect(screen.getByText('User Profile')).toBeInTheDocument();
    expect(screen.getByText('Notification Settings')).toBeInTheDocument();
    expect(screen.getByText('User Settings')).toBeInTheDocument();
  });

  it('displays user information correctly', () => {
    renderWithRouter(<UserSettingsPage />);

    expect(screen.getByDisplayValue('testuser')).toBeInTheDocument();
    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('+1234567890')).toBeInTheDocument();
  });

  it('shows notification preferences', () => {
    renderWithRouter(<UserSettingsPage />);

    expect(screen.getByText('Email Notifications')).toBeInTheDocument();
    expect(screen.getByText('SMS Notifications')).toBeInTheDocument();
    expect(screen.getByText('Meeting Reminders')).toBeInTheDocument();
    expect(screen.getByText('Audit Reminders')).toBeInTheDocument();
  });

  it('can update profile and notification settings', async () => {
    const user = userEvent.setup();

    mockUserService.updateProfile.mockResolvedValue({
      success: true,
      data: { user: { ...mockUser, username: 'newusername' } },
    });

    mockUserService.updateNotificationPreferences.mockResolvedValue({
      success: true,
      data: { user: mockUser },
    });

    renderWithRouter(<UserSettingsPage />);

    // Update username
    const usernameField = screen.getByDisplayValue('testuser');
    await user.clear(usernameField);
    await user.type(usernameField, 'newusername');

    const updateProfileButton = screen.getByRole('button', {
      name: /update profile/i,
    });
    await user.click(updateProfileButton);

    await waitFor(() => {
      expect(mockUserService.updateProfile).toHaveBeenCalledWith({
        username: 'newusername',
      });
    });

    // Update notification preferences
    const emailSwitch = screen.getByRole('checkbox', {
      name: /email notifications/i,
    });
    await user.click(emailSwitch);

    const savePreferencesButton = screen.getByRole('button', {
      name: /save preferences/i,
    });
    await user.click(savePreferencesButton);

    await waitFor(() => {
      expect(mockUserService.updateNotificationPreferences).toHaveBeenCalled();
    });
  });
});
