import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserProfile } from '../UserProfile';
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

describe('UserProfile', () => {
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

  it('renders user profile form with current user data', () => {
    render(<UserProfile />);

    expect(screen.getByDisplayValue('testuser')).toBeInTheDocument();
    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('+1234567890')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    render(<UserProfile />);

    // Clear username field
    const usernameField = screen.getByDisplayValue('testuser');
    await user.clear(usernameField);

    // Try to submit
    const submitButton = screen.getByRole('button', {
      name: /update profile/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Username is required')).toBeInTheDocument();
    });
  });

  it('validates email format', async () => {
    const user = userEvent.setup();
    render(<UserProfile />);

    const emailField = screen.getByDisplayValue('test@example.com');
    await user.clear(emailField);
    await user.type(emailField, 'invalid-email');

    const submitButton = screen.getByRole('button', {
      name: /update profile/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Please enter a valid email address')
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

  it('validates password strength', async () => {
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

  it('validates password confirmation', async () => {
    const user = userEvent.setup();
    render(<UserProfile />);

    const passwordField = screen.getByTestId('new-password-input');
    const confirmField = screen.getByTestId('confirm-password-input');

    await user.type(passwordField, 'ValidPass123');
    await user.type(confirmField, 'DifferentPass123');

    const submitButton = screen.getByRole('button', {
      name: /update profile/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
  });

  it('shows/hides password fields', async () => {
    const user = userEvent.setup();
    render(<UserProfile />);

    const passwordField = screen.getByTestId('new-password-input');
    const toggleButton = screen.getByTestId('toggle-new-password-visibility');

    expect(passwordField).toHaveAttribute('type', 'password');

    await user.click(toggleButton);
    expect(passwordField).toHaveAttribute('type', 'text');

    await user.click(toggleButton);
    expect(passwordField).toHaveAttribute('type', 'password');
  });

  it('submits profile update successfully', async () => {
    const user = userEvent.setup();
    const mockOnProfileUpdate = jest.fn();

    mockUserService.updateProfile.mockResolvedValue({
      success: true,
      data: {
        user: { ...mockUser, username: 'newusername' },
      },
    });

    render(<UserProfile onProfileUpdate={mockOnProfileUpdate} />);

    const usernameField = screen.getByDisplayValue('testuser');
    await user.clear(usernameField);
    await user.type(usernameField, 'newusername');

    const submitButton = screen.getByRole('button', {
      name: /update profile/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockUserService.updateProfile).toHaveBeenCalledWith({
        username: 'newusername',
      });
    });

    await waitFor(() => {
      expect(
        screen.getByText('Profile updated successfully')
      ).toBeInTheDocument();
    });

    expect(mockOnProfileUpdate).toHaveBeenCalled();
  });

  it('handles profile update error', async () => {
    const user = userEvent.setup();

    mockUserService.updateProfile.mockResolvedValue({
      success: false,
      error: {
        code: 'USERNAME_EXISTS',
        message: 'Username already exists',
      },
    });

    render(<UserProfile />);

    const usernameField = screen.getByDisplayValue('testuser');
    await user.clear(usernameField);
    await user.type(usernameField, 'existinguser');

    const submitButton = screen.getByRole('button', {
      name: /update profile/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Username already exists')).toBeInTheDocument();
    });
  });

  it('shows loading state during submission', async () => {
    const user = userEvent.setup();

    // Mock a delayed response
    mockUserService.updateProfile.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ success: true }), 100)
        )
    );

    render(<UserProfile />);

    const usernameField = screen.getByDisplayValue('testuser');
    await user.clear(usernameField);
    await user.type(usernameField, 'newusername');

    const submitButton = screen.getByRole('button', {
      name: /update profile/i,
    });
    await user.click(submitButton);

    expect(screen.getByText('Updating...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    await waitFor(() => {
      expect(screen.queryByText('Updating...')).not.toBeInTheDocument();
    });
  });

  it('does not submit if no changes are made', async () => {
    const user = userEvent.setup();
    render(<UserProfile />);

    const submitButton = screen.getByRole('button', {
      name: /update profile/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('No changes to save')).toBeInTheDocument();
    });

    expect(mockUserService.updateProfile).not.toHaveBeenCalled();
  });

  it('clears password fields after successful update', async () => {
    const user = userEvent.setup();

    mockUserService.updateProfile.mockResolvedValue({
      success: true,
      data: { user: mockUser },
    });

    render(<UserProfile />);

    const passwordField = screen.getByTestId('new-password-input');
    const confirmField = screen.getByTestId('confirm-password-input');

    await user.type(passwordField, 'NewPass123');
    await user.type(confirmField, 'NewPass123');

    const submitButton = screen.getByRole('button', {
      name: /update profile/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(passwordField).toHaveValue('');
      expect(confirmField).toHaveValue('');
    });
  });
});
