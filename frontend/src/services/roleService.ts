import apiClient, { ApiResponse, ApiError } from './apiClient';

export type UserRole = 'CEO' | 'MANAGER' | 'TEAM_MEMBER';
export type RoleChangeStatus = 'PENDING' | 'APPROVED' | 'DENIED';

export interface RoleChangeRequest {
  id: string;
  userId: string;
  currentRole: UserRole;
  requestedRole: UserRole;
  justification: string;
  status: RoleChangeStatus;
  submittedAt: string;
  processedAt?: string;
  processedBy?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RoleChangeRequestWithUser extends RoleChangeRequest {
  user?: {
    id: string;
    username: string;
    email: string;
  };
}

export interface RolePermissions {
  role: UserRole;
  permissions: {
    canManageCompanies: boolean;
    canScheduleAudits: boolean;
    canViewAllAudits: boolean;
    canManageUsers: boolean;
    canApproveRoleChanges: boolean;
    canViewReports: boolean;
  };
  description: string;
}

export interface RoleChangeRequestData {
  requestedRole: UserRole;
  justification: string;
}

export interface ProcessRoleRequestData {
  action: 'approve' | 'deny';
  adminNotes?: string;
}

export interface RoleChangeStatistics {
  total: number;
  pending: number;
  approved: number;
  denied: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class RoleService {
  /**
   * Submit a role change request
   * Requirements: 2.3, 2.4, 2.5, 2.6
   */
  static async requestRoleChange(
    data: RoleChangeRequestData
  ): Promise<ApiResponse<RoleChangeRequest> | ApiError> {
    try {
      const response = await apiClient.post('/roles/request', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get pending role change requests (for administrators)
   * Requirements: 3.1, 3.2
   */
  static async getPendingRequests(): Promise<
    ApiResponse<RoleChangeRequestWithUser[]> | ApiError
  > {
    try {
      const response = await apiClient.get('/roles/pending');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Process a role change request (approve or deny)
   * Requirements: 3.3, 3.4, 3.5, 3.6
   */
  static async processRoleRequest(
    requestId: string,
    data: ProcessRoleRequestData
  ): Promise<ApiResponse<RoleChangeRequest> | ApiError> {
    try {
      const response = await apiClient.put(`/roles/process/${requestId}`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get current user's role change requests
   * Requirements: 2.7, 4.3
   */
  static async getUserRoleRequests(): Promise<
    ApiResponse<RoleChangeRequest[]> | ApiError
  > {
    try {
      const response = await apiClient.get('/roles/my-requests');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get current user's pending role change request
   * Requirements: 2.7, 4.3
   */
  static async getUserPendingRequest(): Promise<
    ApiResponse<RoleChangeRequest | null> | ApiError
  > {
    try {
      const response = await apiClient.get('/roles/my-pending-request');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get role permissions for a specific role
   * Requirements: 4.2, 4.4
   */
  static async getRolePermissions(
    role: UserRole
  ): Promise<ApiResponse<RolePermissions> | ApiError> {
    try {
      const response = await apiClient.get(`/roles/permissions/${role}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all role permissions
   * Requirements: 4.4
   */
  static async getAllRolePermissions(): Promise<
    ApiResponse<RolePermissions[]> | ApiError
  > {
    try {
      const response = await apiClient.get('/roles/permissions');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Cancel a pending role change request
   * Requirements: 2.8
   */
  static async cancelRoleRequest(
    requestId: string
  ): Promise<ApiResponse<void> | ApiError> {
    try {
      const response = await apiClient.delete(`/roles/cancel/${requestId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get role change statistics (for administrators)
   */
  static async getRoleChangeStatistics(): Promise<
    ApiResponse<RoleChangeStatistics> | ApiError
  > {
    try {
      const response = await apiClient.get('/roles/statistics');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Validate role change request data on the client side
   */
  static validateRoleChangeRequest(
    data: RoleChangeRequestData
  ): ValidationResult {
    const errors: string[] = [];

    if (!data.requestedRole) {
      errors.push('Requested role is required');
    } else if (
      !['CEO', 'MANAGER', 'TEAM_MEMBER'].includes(data.requestedRole)
    ) {
      errors.push('Invalid role requested');
    }

    if (!data.justification) {
      errors.push('Justification is required');
    } else if (data.justification.trim().length < 10) {
      errors.push('Justification must be at least 10 characters long');
    } else if (data.justification.trim().length > 500) {
      errors.push('Justification must be less than 500 characters');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check if user can request a specific role
   */
  static canRequestRole(
    currentRole: UserRole,
    requestedRole: UserRole
  ): boolean {
    return currentRole !== requestedRole;
  }

  /**
   * Check if user can approve role changes based on their role
   */
  static canApproveRoleChanges(userRole: UserRole): boolean {
    return userRole === 'CEO' || userRole === 'MANAGER';
  }

  /**
   * Get user-friendly role display name
   */
  static getRoleDisplayName(role: UserRole): string {
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
  }

  /**
   * Get role change status display name
   */
  static getStatusDisplayName(status: RoleChangeStatus): string {
    switch (status) {
      case 'PENDING':
        return 'Pending Review';
      case 'APPROVED':
        return 'Approved';
      case 'DENIED':
        return 'Denied';
      default:
        return status;
    }
  }

  /**
   * Get role change status color for UI
   */
  static getStatusColor(status: RoleChangeStatus): string {
    switch (status) {
      case 'PENDING':
        return 'orange';
      case 'APPROVED':
        return 'green';
      case 'DENIED':
        return 'red';
      default:
        return 'gray';
    }
  }

  /**
   * Format role change request for display
   */
  static formatRoleChangeRequest(request: RoleChangeRequest): {
    id: string;
    currentRoleDisplay: string;
    requestedRoleDisplay: string;
    statusDisplay: string;
    statusColor: string;
    submittedDate: string;
    processedDate?: string;
  } {
    return {
      id: request.id,
      currentRoleDisplay: this.getRoleDisplayName(request.currentRole),
      requestedRoleDisplay: this.getRoleDisplayName(request.requestedRole),
      statusDisplay: this.getStatusDisplayName(request.status),
      statusColor: this.getStatusColor(request.status),
      submittedDate: new Date(request.submittedAt).toLocaleDateString(),
      processedDate: request.processedAt
        ? new Date(request.processedAt).toLocaleDateString()
        : undefined,
    };
  }
}
