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

describe('RoleDisplay Enhanced Features', () => {
  const mockUser = {
    id: '1',
    username: 'testuser',
    email: 'test@example.com',
    phoneNumber: '+1234567890',
    role: 'MANAGER' as const,
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
    {
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
    },
  ];

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
      data: mockAllRolePermissions[1], // Manager permissions
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
  });

  it('displays comprehensive role information prominently', async () => {
    render(<RoleDisplay />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Check prominent role display (Requirement 4.1)
    expect(screen.getByText('Role Information')).toBeInTheDocument();
    expect(screen.getByText('Current Role')).toBeInTheDocument();
    expect(screen.getByText('Manager')).toBeInTheDocument();
    expect(
      screen.getByText('Manager with elevated permissions')
    ).toBeInTheDocument();
    expect(screen.getByText('Hierarchy Level: 2 of 3')).toBeInTheDocument();
  });

  it('shows role permissions with allowed and denied actions', async () => {
    render(<RoleDisplay />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Check permissions display (Requirement 4.2)
    expect(screen.getByText('Your Permissions')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Your current role grants you access to the following features and actions:'
      )
    ).toBeInTheDocument();

    // Should show allowed permissions
    expect(screen.getByText('Manage Companies')).toBeInTheDocument();
    expect(screen.getByText('Schedule Audits')).toBeInTheDocument();
    expect(screen.getByText('View All Audits')).toBeInTheDocument();
    expect(screen.getByText('Approve Role Changes')).toBeInTheDocument();
    expect(screen.getByText('View Reports')).toBeInTheDocument();

    // Should show denied permissions
    expect(
      screen.getByText('Permissions not available to your role:')
    ).toBeInTheDocument();
    expect(screen.getByText('Manage Users')).toBeInTheDocument();
  });

  it('displays role descriptions and help text for each role level', async () => {
    render(<RoleDisplay />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Check role descriptions section (Requirement 4.4, 4.5)
    expect(
      screen.getByText('Role Descriptions & Hierarchy')
    ).toBeInTheDocument();

    // The accordion should be expandable to show all role descriptions
    const accordion = screen.getByText('Role Descriptions & Hierarchy');
    expect(accordion).toBeInTheDocument();
  });

  it('handles pending role change status display', async () => {
    const mockPendingRequest = {
      id: '1',
      userId: '1',
      currentRole: 'MANAGER' as const,
      requestedRole: 'CEO' as const,
      justification: 'Need CEO access for company decisions',
      status: 'PENDING' as const,
      submittedAt: '2023-01-01T00:00:00Z',
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
    };

    mockRoleService.getUserPendingRequest.mockResolvedValue({
      success: true,
      data: mockPendingRequest,
    });

    mockRoleService.getStatusDisplayName.mockReturnValue('Pending Review');

    render(<RoleDisplay />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Check pending request display (Requirement 4.3)
    expect(screen.getByText('Pending Role Change Request')).toBeInTheDocument();
    expect(screen.getByText('Chief Executive Officer')).toBeInTheDocument();
    expect(screen.getByText('Pending Review')).toBeInTheDocument();
    expect(
      screen.getByText('Need CEO access for company decisions')
    ).toBeInTheDocument();
  });
});
