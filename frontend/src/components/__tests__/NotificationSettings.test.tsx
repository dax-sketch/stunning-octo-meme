import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

describe('NotificationSettings', () => {
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

  it('renders notification settings with current preferences', () => {
    render(<NotificationSettings />);

    expect(screen.getByText('Notification Settings')).toBeInTheDocument();
    expect(screen.getByText('Email Notifications')).toBeInTheDocument();
    expect(screen.getByText('SMS Notifications')).toBeInTheDocument();
    expect(screen.getByText('Meeting Reminders')).toBeInTheDocument();
    expect(screen.getByText('Audit Reminders')).toBeInTheDocument();
  });

  it('displays user contact information', () => {
    render(<NotificationSettings />);

    expect(screen.getByText(/test@example.com/)).toBeInTheDocument();
    expect(screen.getByText(/\+1234567890/)).toBeInTheDocument();
  });

  it('shows enabled status chips for active preferences', () => {
    render(<NotificationSettings />);

    const enabledChips = screen.getAllByText('Enabled');
    expect(enabledChips).toHaveLength(4); // All preferences are enabled in mock
  });

  it('toggles notification preferences', async () => {
    const user = userEvent.setup();
    render(<NotificationSettings />);

    const emailSwitch = screen.getByRole('checkbox', {
      name: /email notifications/i,
    });
    expect(emailSwitch).toBeChecked();

    await act(async () => {
      await user.click(emailSwitch);
    });
    expect(emailSwitch).not.toBeChecked();
  });

  it('saves notification preferences successfully', async () => {
    const user = userEvent.setup();
    const mockOnSettingsUpdate = jest.fn();

    mockUserService.updateNotificationPreferences.mockResolvedValue({
      success: true,
      data: {
        user: { ...mockUser, emailNotifications: false },
      },
    });

    render(<NotificationSettings onSettingsUpdate={mockOnSettingsUpdate} />);

    // Toggle email notifications off
    const emailSwitch = screen.getByRole('checkbox', {
      name: /email notifications/i,
    });
    await act(async () => {
      await user.click(emailSwitch);
    });

    // Save preferences
    const saveButton = screen.getByRole('button', {
      name: /save preferences/i,
    });
    await act(async () => {
      await user.click(saveButton);
    });

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

    expect(mockOnSettingsUpdate).toHaveBeenCalled();
  });

  it('handles save preferences error', async () => {
    const user = userEvent.setup();

    mockUserService.updateNotificationPreferences.mockResolvedValue({
      success: false,
      error: {
        code: 'PREFERENCES_UPDATE_FAILED',
        message: 'Failed to update preferences',
      },
    });

    render(<NotificationSettings />);

    const saveButton = screen.getByRole('button', {
      name: /save preferences/i,
    });
    await act(async () => {
      await user.click(saveButton);
    });

    await waitFor(() => {
      expect(
        screen.getByText('Failed to update preferences')
      ).toBeInTheDocument();
    });
  });

  it('opens test notification dialog', async () => {
    const user = userEvent.setup();
    render(<NotificationSettings />);

    const testButton = screen.getByRole('button', {
      name: /test notifications/i,
    });
    await act(async () => {
      await user.click(testButton);
    });

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Email only')).toBeInTheDocument();
    expect(screen.getByText('SMS only')).toBeInTheDocument();
    expect(screen.getByText('Both email and SMS')).toBeInTheDocument();
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

  it('sends test email notification', async () => {
    const user = userEvent.setup();

    mockUserService.testNotification.mockResolvedValue({
      success: true,
      data: {
        results: { email: true },
      },
    });

    render(<NotificationSettings />);

    // Open test dialog
    const testButton = screen.getByRole('button', {
      name: /test notifications/i,
    });
    await act(async () => {
      await user.click(testButton);
    });

    // Select email only
    const emailRadio = screen.getByRole('radio', { name: /email only/i });
    await act(async () => {
      await user.click(emailRadio);
    });

    // Send test
    const sendButton = screen.getByRole('button', { name: /send test/i });
    await act(async () => {
      await user.click(sendButton);
    });

    await waitFor(() => {
      expect(mockUserService.testNotification).toHaveBeenCalledWith({
        type: 'email',
      });
    });

    await waitFor(() => {
      expect(screen.getByText(/test notification sent/i)).toBeInTheDocument();
    });
  });

  it('sends test SMS notification', async () => {
    const user = userEvent.setup();

    mockUserService.testNotification.mockResolvedValue({
      success: true,
      data: {
        results: { sms: true },
      },
    });

    render(<NotificationSettings />);

    // Open test dialog
    const testButton = screen.getByRole('button', {
      name: /test notifications/i,
    });
    await act(async () => {
      await user.click(testButton);
    });

    // Select SMS only
    const smsRadio = screen.getByRole('radio', { name: /sms only/i });
    await act(async () => {
      await user.click(smsRadio);
    });

    // Send test
    const sendButton = screen.getByRole('button', { name: /send test/i });
    await act(async () => {
      await user.click(sendButton);
    });

    await waitFor(() => {
      expect(mockUserService.testNotification).toHaveBeenCalledWith({
        type: 'sms',
      });
    });
  });

  it('sends both test notifications', async () => {
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
    await act(async () => {
      await user.click(testButton);
    });

    // Select both
    const bothRadio = screen.getByRole('radio', {
      name: /both email and sms/i,
    });
    await act(async () => {
      await user.click(bothRadio);
    });

    // Send test
    const sendButton = screen.getByRole('button', { name: /send test/i });
    await act(async () => {
      await user.click(sendButton);
    });

    await waitFor(() => {
      expect(mockUserService.testNotification).toHaveBeenCalledWith({
        type: 'both',
      });
    });
  });

  it('displays test results', async () => {
    const user = userEvent.setup();

    mockUserService.testNotification.mockResolvedValue({
      success: true,
      data: {
        results: { email: true, sms: false },
      },
    });

    render(<NotificationSettings />);

    // Open test dialog and send test
    const testButton = screen.getByRole('button', {
      name: /test notifications/i,
    });
    await act(async () => {
      await user.click(testButton);
    });

    const bothRadio = screen.getByRole('radio', {
      name: /both email and sms/i,
    });
    await act(async () => {
      await user.click(bothRadio);
    });

    const sendButton = screen.getByRole('button', { name: /send test/i });
    await act(async () => {
      await user.click(sendButton);
    });

    await waitFor(() => {
      expect(screen.getByText(/test results/i)).toBeInTheDocument();
      expect(screen.getByText(/email.*sent successfully/i)).toBeInTheDocument();
      expect(screen.getByText(/sms.*failed to send/i)).toBeInTheDocument();
    });
  });

  it('handles test notification error', async () => {
    const user = userEvent.setup();

    mockUserService.testNotification.mockResolvedValue({
      success: false,
      error: {
        code: 'TEST_NOTIFICATION_FAILED',
        message: 'Failed to send test notification',
      },
    });

    render(<NotificationSettings />);

    // Open test dialog and send test
    const testButton = screen.getByRole('button', {
      name: /test notifications/i,
    });
    await act(async () => {
      await user.click(testButton);
    });

    const sendButton = screen.getByRole('button', { name: /send test/i });
    await act(async () => {
      await user.click(sendButton);
    });

    await waitFor(() => {
      expect(
        screen.getByText('Failed to send test notification')
      ).toBeInTheDocument();
    });
  });

  it('shows loading state during save', async () => {
    const user = userEvent.setup();

    // Mock a delayed response
    mockUserService.updateNotificationPreferences.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ success: true }), 100)
        )
    );

    render(<NotificationSettings />);

    const saveButton = screen.getByRole('button', {
      name: /save preferences/i,
    });
    await act(async () => {
      await user.click(saveButton);
    });

    expect(screen.getByText('Saving...')).toBeInTheDocument();
    expect(saveButton).toBeDisabled();

    await waitFor(() => {
      expect(screen.queryByText('Saving...')).not.toBeInTheDocument();
    });
  });

  it('shows loading state during test notification', async () => {
    const user = userEvent.setup();

    // Mock a delayed response
    mockUserService.testNotification.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () => resolve({ success: true, data: { results: {} } }),
            100
          )
        )
    );

    render(<NotificationSettings />);

    // Open test dialog
    const testButton = screen.getByRole('button', {
      name: /test notifications/i,
    });
    await act(async () => {
      await user.click(testButton);
    });

    const sendButton = screen.getByRole('button', { name: /send test/i });
    await act(async () => {
      await user.click(sendButton);
    });

    expect(screen.getByText('Sending...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText('Sending...')).not.toBeInTheDocument();
    });
  });
});
