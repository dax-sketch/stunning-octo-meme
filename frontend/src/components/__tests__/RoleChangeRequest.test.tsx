import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RoleChangeRequest } from '../RoleChangeRequest';
import { useAuth } from '../../hooks/useAuth';
import { RoleService } from '../../services/roleService';

// Mock the hooks and services
jest.mock('../../hooks/useAuth');
jest.mock('../../services/roleService');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockRoleService = RoleService as jest.Mocked<typeof RoleService>;

describe('RoleChangeRequest', () => {
  const mockUser = {
    id: '1',
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

  const mockAllRolePermissions = [
    {
      role: 'CEO' as const,
      permissions: {
        canManageCompanies: true,
        canScheduleAudits: true,
        canViewAllAudits: true,
        canManageUsers: true,
        canApproveRoleChanges: true,
        canViewReports: true,
      },
      description: 'Full system access',
    },
    {
      role: 'MANAGER' as const,
      permissions: {
        canManageCompanies: true,
        canScheduleAudits: true,
        canViewAllAudits: true,
        canManageUsers: false,
        canApproveRoleChanges: true,
        canViewReports: true,
      },
      description: 'Management level access',
    },
  ];

  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: mockUser,
      token: 'mock-token',
      isAuthenticated: true,
      isLoading: false,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
    });

    mockRoleService.getAllRolePermissions.mockResolvedValue({
      success: true,
      data: mockAllRolePermissions,
    });

    mockRoleService.getRoleDisplayName.mockImplementation((role) => {
      switch (role) {
        case 'CEO':
          return 'Chief Executive Officer';
        case 'MANAGER':
          return 'Manager';
        case 'TEAM_MEMBER':
          return 'Team Member';
        default:
          return role;
      }
    });

    mockRoleService.validateRoleChangeRequest.mockReturnValue({
      isValid: true,
      errors: [],
    });
  });

  it('renders dialog when open', async () => {
    render(
      <RoleChangeRequest
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByText('Request Role Change')).toBeInTheDocument();
    expect(screen.getByText('Current Role')).toBeInTheDocument();
    expect(screen.getByText('Team Member')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <RoleChangeRequest
        open={false}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.queryByText('Request Role Change')).not.toBeInTheDocument();
  });

  it('allows user to select a role and enter justification', async () => {
    const user = userEvent.setup();

    render(
      <RoleChangeRequest
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Select a role
    const roleSelect = screen.getByLabelText('Requested Role');
    await user.click(roleSelect);

    const managerOption = screen.getByText('Manager');
    await user.click(managerOption);

    // Enter justification
    const justificationField = screen.getByLabelText('Business Justification');
    await user.type(
      justificationField,
      'I need manager access to handle team responsibilities'
    );

    expect(roleSelect).toHaveValue('MANAGER');
    expect(justificationField).toHaveValue(
      'I need manager access to handle team responsibilities'
    );
  });

  it('validates form before submission', async () => {
    const user = userEvent.setup();

    render(
      <RoleChangeRequest
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Try to submit without filling required fields
    const submitButton = screen.getByText('Submit Request');
    expect(submitButton).toBeDisabled();

    // Fill only role
    const roleSelect = screen.getByLabelText('Requested Role');
    await user.click(roleSelect);
    const managerOption = screen.getByText('Manager');
    await user.click(managerOption);

    // Submit button should still be disabled without justification
    expect(submitButton).toBeDisabled();

    // Add justification
    const justificationField = screen.getByLabelText('Business Justification');
    await user.type(justificationField, 'Valid justification');

    // Now submit button should be enabled
    expect(submitButton).not.toBeDisabled();
  });

  it('submits role change request successfully', async () => {
    const user = userEvent.setup();

    mockRoleService.requestRoleChange.mockResolvedValue({
      success: true,
      data: {
        id: '1',
        userId: '1',
        currentRole: 'TEAM_MEMBER',
        requestedRole: 'MANAGER',
        justification: 'Valid justification',
        status: 'PENDING',
        submittedAt: '2023-01-01T00:00:00Z',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      },
    });

    render(
      <RoleChangeRequest
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Fill form
    const roleSelect = screen.getByLabelText('Requested Role');
    await user.click(roleSelect);
    const managerOption = screen.getByText('Manager');
    await user.click(managerOption);

    const justificationField = screen.getByLabelText('Business Justification');
    await user.type(justificationField, 'Valid justification for role change');

    // Submit form
    const submitButton = screen.getByText('Submit Request');
    await user.click(submitButton);

    // Verify API was called
    await waitFor(() => {
      expect(mockRoleService.requestRoleChange).toHaveBeenCalledWith({
        requestedRole: 'MANAGER',
        justification: 'Valid justification for role change',
      });
    });

    // Check success message
    expect(
      screen.getByText(/Role change request submitted successfully/)
    ).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    const user = userEvent.setup();

    mockRoleService.requestRoleChange.mockResolvedValue({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid role request',
      },
    });

    render(
      <RoleChangeRequest
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Fill and submit form
    const roleSelect = screen.getByLabelText('Requested Role');
    await user.click(roleSelect);
    const managerOption = screen.getByText('Manager');
    await user.click(managerOption);

    const justificationField = screen.getByLabelText('Business Justification');
    await user.type(justificationField, 'Valid justification');

    const submitButton = screen.getByText('Submit Request');
    await user.click(submitButton);

    // Check error message
    await waitFor(() => {
      expect(screen.getByText('Invalid role request')).toBeInTheDocument();
    });
  });

  it('closes dialog when cancel is clicked', async () => {
    const user = userEvent.setup();

    render(
      <RoleChangeRequest
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });
});
