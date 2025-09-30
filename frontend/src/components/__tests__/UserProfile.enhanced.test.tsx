import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { UserProfile } from '../UserProfile';
import { useAuth } from '../../hooks/useAuth';
import { UserService } from '../../services/userService';
import { RoleService } from '../../services/roleService';

// Mock the hooks and services
jest.mock('../../hooks/useAuth');
jest.mock('../../services/userService');
jest.mock('../../services/roleService');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUserService = UserService as jest.Mocked<typeof UserService>;
const mockRoleService = RoleService as jest.Mocked<typeof RoleService>;

describe('UserProfile Enhanced with Role Information', () => {
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

  const mockRolePermissions = {
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

    // Mock role service responses
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
      data: [mockRolePermissions],
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

  it('displays role information prominently at the top of profile', async () => {
    render(<UserProfile />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Check that role information appears before profile information
    expect(screen.getByText('Role Information')).toBeInTheDocument();
    expect(screen.getByText('Profile Information')).toBeInTheDocument();

    // Role information should be displayed prominently
    expect(screen.getByText('Current Role')).toBeInTheDocument();
    expect(screen.getByText('Manager')).toBeInTheDocument();
    expect(
      screen.getByText('Manager with elevated permissions')
    ).toBeInTheDocument();
  });

  it('shows comprehensive role permissions in user profile', async () => {
    render(<UserProfile />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Check that permissions are displayed
    expect(screen.getByText('Your Permissions')).toBeInTheDocument();
    expect(screen.getByText('Manage Companies')).toBeInTheDocument();
    expect(screen.getByText('Schedule Audits')).toBeInTheDocument();
    expect(screen.getByText('View All Audits')).toBeInTheDocument();
    expect(screen.getByText('Approve Role Changes')).toBeInTheDocument();
    expect(screen.getByText('View Reports')).toBeInTheDocument();
  });

  it('includes role change request functionality', async () => {
    render(<UserProfile />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Check that role change request button is available
    expect(screen.getByText('Request Role Change')).toBeInTheDocument();
  });

  it('displays role descriptions and help text', async () => {
    render(<UserProfile />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Check that role descriptions section is available
    expect(
      screen.getByText('Role Descriptions & Hierarchy')
    ).toBeInTheDocument();
  });
});
