import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserProfile } from '../UserProfile';
import { NotificationSettings } from '../NotificationSettings';
import { UserService } from '../../services/userService';
import { useAuth } from '../../hooks/useAuth';

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

describe('User Settings E2E Tests', () => {
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

  describe('UserProfile Component', () => {
    it('successfully updates user profile', async () => {
      const user = userEvent.setup();

      mockUserService.updateProfile.mockResolvedValue({
        success: true,
        data: {
          user: {
            ...mockUser,
            username: 'newusername',
            email: 'newemail@example.com',
          },
        },
      });

      render(<UserProfile />);

      // Update username and email
      const usernameField = screen.getByDisplayValue('testuser');
      const emailField = screen.getByDisplayValue('test@example.com');

      await user.clear(usernameField);
      await user.type(usernameField, 'newusername');

      await user.clear(emailField);
      await user.type(emailField, 'newemail@example.com');

      const submitButton = screen.getByRole('button', {
        name: /update profile/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockUserService.updateProfile).toHaveBeenCalledWith({
          username: 'newusername',
          email: 'newemail@example.com',
        });
      });

      await waitFor(() => {
        expect(
          screen.getByText('Profile updated successfully')
        ).toBeInTheDocument();
      });
    });

    it('validates phone number format', async () => {
      const user = userEvent.setup();
      render(<UserProfile />);

      const phoneField = screen.getByDisplayValue('+1234567890');
      await user.clear(phoneField);
      await user.type(phoneField, '123');

      const submitButton = screen.getByRole('button', {
        name: /update profile/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText('Please enter a valid phone number')
        ).toBeInTheDocument();
      });
    });

    it('validates password requirements', async () => {
      const user = userEvent.setup();
      render(<UserProfile />);

      const passwordField = screen.getByTestId('new-password-input');
      await user.type(passwordField, 'weak');

      const submitButton = screen.getByRole('button', {
        name: /update profile/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/password must be at least 8 characters/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('NotificationSettings Component', () => {
    it('successfully updates notification preferences', async () => {
      const user = userEvent.setup();

      mockUserService.updateNotificationPreferences.mockResolvedValue({
        success: true,
        data: {
          user: { ...mockUser, emailNotifications: false },
        },
      });

      render(<NotificationSettings />);

      // Toggle email notifications off
      const emailSwitch = screen.getByRole('checkbox', {
        name: /email notifications/i,
      });
      await user.click(emailSwitch);

      // Save preferences
      const saveButton = screen.getByRole('button', {
        name: /save preferences/i,
      });
      await user.click(saveButton);

      await waitFor(() => {
        expect(
          mockUserService.updateNotificationPreferences
        ).toHaveBeenCalledWith({
          emailNotifications: false,
          smsNotifications: true,
          meetingReminders: true,
          auditReminders: true,
        });
      });

      await waitFor(() => {
        expect(
          screen.getByText('Notification preferences updated successfully')
        ).toBeInTheDocument();
      });
    });

    it('sends test notifications successfully', async () => {
      const user = userEvent.setup();

      mockUserService.testNotification.mockResolvedValue({
        success: true,
        data: {
          results: { email: true, sms: true },
        },
      });

      render(<NotificationSettings />);

      // Open test dialog
      const testButton = screen.getByRole('button', {
        name: /test notifications/i,
      });
      await user.click(testButton);

      // Select both notifications
      const bothRadio = screen.getByRole('radio', {
        name: /both email and sms/i,
      });
      await user.click(bothRadio);

      // Send test
      const sendButton = screen.getByRole('button', { name: /send test/i });
      await user.click(sendButton);

      await waitFor(() => {
        expect(mockUserService.testNotification).toHaveBeenCalledWith({
          type: 'both',
        });
      });

      await waitFor(() => {
        expect(screen.getByText(/test notification sent/i)).toBeInTheDocument();
      });
    });

    it('disables test button when no notification methods are enabled', () => {
      mockUseAuth.mockReturnValue({
        user: {
          ...mockUser,
          notificationPreferences: {
            email: false,
            sms: false,
            meetingReminders: true,
            auditReminders: true,
          },
        },
        token: 'mock-token',
        isAuthenticated: true,
        isLoading: false,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
      });

      render(<NotificationSettings />);

      const testButton = screen.getByRole('button', {
        name: /test notifications/i,
      });
      expect(testButton).toBeDisabled();
    });
  });
});
