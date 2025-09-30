import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { RoleDisplay } from '../RoleDisplay';
import { useAuth } from '../../hooks/useAuth';
import { RoleService } from '../../services/roleService';

// Mock the hooks and services
jest.mock('../../hooks/useAuth');
jest.mock('../../services/roleService');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockRoleService = RoleService as jest.Mocked<typeof RoleService>;

describe('RoleDisplay', () => {
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

  const mockRolePermissions = {
    role: 'TEAM_MEMBER' as const,
    permissions: {
      canManageCompanies: false,
      canScheduleAudits: true,
      canViewAllAudits: false,
      canManageUsers: false,
      canApproveRoleChanges: false,
      canViewReports: false,
    },
    description: 'Team member with basic access',
  };

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

    // Mock successful API responses
    mockRoleService.getUserPendingRequest.mockResolvedValue({
      success: true,
      data: null,
    });

    mockRoleService.getRolePermissions.mockResolvedValue({
      success: true,
      data: mockRolePermissions,
    });

    mockRoleService.getAllRolePermissions.mockResolvedValue({
      success: true,
      data: [
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
          description: 'Chief Executive Officer with full system access',
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
          description: 'Manager with elevated permissions',
        },
        mockRolePermissions,
      ],
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
  });

  it('renders current role information', async () => {
    render(<RoleDisplay />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Check if role information is displayed
    expect(screen.getByText('Role Information')).toBeInTheDocument();
    expect(screen.getByText('Current Role')).toBeInTheDocument();
    expect(screen.getByText('Team Member')).toBeInTheDocument();
  });

  it('shows request role button when no pending request', async () => {
    const mockOnRequestRole = jest.fn();

    render(
      <RoleDisplay onRequestRole={mockOnRequestRole} showRequestButton={true} />
    );

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Request Role Change')).toBeInTheDocument();
  });

  it('does not show request button when showRequestButton is false', async () => {
    render(<RoleDisplay showRequestButton={false} />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    expect(screen.queryByText('Request Role Change')).not.toBeInTheDocument();
  });

  it('displays pending request when user has one', async () => {
    const mockPendingRequest = {
      id: '1',
      userId: '1',
      currentRole: 'TEAM_MEMBER' as const,
      requestedRole: 'MANAGER' as const,
      justification: 'Need manager access for project',
      status: 'PENDING' as const,
      submittedAt: '2023-01-01T00:00:00Z',
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
    };

    mockRoleService.getUserPendingRequest.mockResolvedValue({
      success: true,
      data: mockPendingRequest,
    });

    mockRoleService.getRoleDisplayName.mockImplementation((role) => {
      switch (role) {
        case 'MANAGER':
          return 'Manager';
        default:
          return role;
      }
    });

    mockRoleService.getStatusDisplayName.mockReturnValue('Pending Review');

    render(<RoleDisplay />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Pending Role Change Request')).toBeInTheDocument();
    expect(screen.getByText('Manager')).toBeInTheDocument();
    expect(screen.getByText('Pending Review')).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    mockRoleService.getUserPendingRequest.mockRejectedValue(
      new Error('API Error')
    );
    mockRoleService.getRolePermissions.mockRejectedValue(
      new Error('API Error')
    );
    mockRoleService.getAllRolePermissions.mockRejectedValue(
      new Error('API Error')
    );

    render(<RoleDisplay />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    expect(
      screen.getByText('Failed to load role information')
    ).toBeInTheDocument();
  });

  it('displays role permissions correctly', async () => {
    render(<RoleDisplay />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Your Permissions')).toBeInTheDocument();
    expect(screen.getByText('Schedule Audits')).toBeInTheDocument();
  });

  it('shows role hierarchy information', async () => {
    render(<RoleDisplay />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    expect(
      screen.getByText('Role Descriptions & Hierarchy')
    ).toBeInTheDocument();
  });
});
