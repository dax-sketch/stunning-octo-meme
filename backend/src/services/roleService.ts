import { 
  RoleChangeRequestModel, 
  CreateRoleChangeRequestData, 
  AppwriteRoleChangeRequest,
  ROLE_CHANGE_STATUS,
  ROLE_PERMISSIONS,
  RolePermissions,
  type RoleChangeStatus 
} from '../models/AppwriteRoleChangeRequest';
import { UserModel, AppwriteUser } from '../models/AppwriteUser';
import { NotificationService } from './notificationService';
import { NOTIFICATION_TYPES, USER_ROLES, type UserRole } from '../config/appwrite';

export interface RoleChangeRequestData {
  userId: string;
  requestedRole: UserRole;
  justification: string;
}

export interface ProcessRoleRequestData {
  requestId: string;
  action: 'approve' | 'deny';
  adminNotes?: string;
  processedBy: string;
}

export interface RoleChangeRequestWithUser extends AppwriteRoleChangeRequest {
  user?: AppwriteUser | undefined;
}

export class RoleService {
  /**
   * Submit a role change request
   * Requirements: 2.3, 2.4, 2.5, 2.6
   */
  static async requestRoleChange(data: RoleChangeRequestData): Promise<AppwriteRoleChangeRequest> {
    // Validate user exists
    const user = await UserModel.findById(data.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Check if user already has a pending request
    const existingRequest = await RoleChangeRequestModel.findPendingByUserId(data.userId);
    if (existingRequest) {
      throw new Error('User already has a pending role change request');
    }

    // Validate requested role
    if (!Object.values(USER_ROLES).includes(data.requestedRole)) {
      throw new Error('Invalid role requested');
    }

    // Prevent requesting the same role
    if (user.role === data.requestedRole) {
      throw new Error('Cannot request the same role you currently have');
    }

    // Validate justification
    if (!data.justification || data.justification.trim().length < 10) {
      throw new Error('Justification must be at least 10 characters long');
    }

    // Create the role change request
    const request = await RoleChangeRequestModel.create({
      userId: data.userId,
      currentRole: user.role,
      requestedRole: data.requestedRole,
      justification: data.justification.trim(),
    });

    // Notify administrators about the new request
    await this.notifyAdministratorsOfNewRequest(request, user);

    return request;
  }

  /**
   * Get pending role change requests for administrators
   * Requirements: 3.1, 3.2
   */
  static async getPendingRequests(): Promise<RoleChangeRequestWithUser[]> {
    const requests = await RoleChangeRequestModel.findPending();
    
    // Enrich requests with user information
    const requestsWithUsers: RoleChangeRequestWithUser[] = [];
    
    for (const request of requests) {
      try {
        const user = await UserModel.findById(request.userId);
        requestsWithUsers.push({
          ...request,
          user: user || undefined,
        });
      } catch (error) {
        console.error(`Error fetching user ${request.userId} for request ${request.$id}:`, error);
        requestsWithUsers.push(request);
      }
    }

    return requestsWithUsers;
  }

  /**
   * Process a role change request (approve or deny)
   * Requirements: 3.3, 3.4, 3.5, 3.6
   */
  static async processRoleRequest(data: ProcessRoleRequestData): Promise<AppwriteRoleChangeRequest> {
    // Validate the request exists and is pending
    const request = await RoleChangeRequestModel.findById(data.requestId);
    if (!request) {
      throw new Error('Role change request not found');
    }

    if (request.status !== ROLE_CHANGE_STATUS.PENDING) {
      throw new Error('Role change request has already been processed');
    }

    // Validate the admin user exists and has permission
    const adminUser = await UserModel.findById(data.processedBy);
    if (!adminUser) {
      throw new Error('Admin user not found');
    }

    if (!this.canApproveRoleChanges(adminUser.role)) {
      throw new Error('User does not have permission to approve role changes');
    }

    // Process the request
    const processedRequest = await RoleChangeRequestModel.process(
      data.requestId,
      data.action,
      data.processedBy,
      data.adminNotes
    );

    // If approved, update the user's role
    if (data.action === 'approve') {
      await UserModel.update(request.userId, {
        role: request.requestedRole,
      });
    }

    // Notify the user about the decision
    await this.notifyUserOfDecision(processedRequest, data.action);

    return processedRequest;
  }

  /**
   * Get user's role change request history
   * Requirements: 2.7, 4.3
   */
  static async getUserRoleRequests(userId: string): Promise<AppwriteRoleChangeRequest[]> {
    return await RoleChangeRequestModel.findByUserId(userId);
  }

  /**
   * Get user's pending role change request
   * Requirements: 2.7, 4.3
   */
  static async getUserPendingRequest(userId: string): Promise<AppwriteRoleChangeRequest | null> {
    return await RoleChangeRequestModel.findPendingByUserId(userId);
  }

  /**
   * Get role permissions for a specific role
   * Requirements: 4.2, 4.4
   */
  static async getRolePermissions(role: UserRole): Promise<RolePermissions> {
    if (!Object.values(USER_ROLES).includes(role)) {
      throw new Error('Invalid role');
    }

    return ROLE_PERMISSIONS[role];
  }

  /**
   * Get all role permissions
   * Requirements: 4.4
   */
  static async getAllRolePermissions(): Promise<RolePermissions[]> {
    return Object.values(ROLE_PERMISSIONS);
  }

  /**
   * Check if user can request a specific role
   */
  static canRequestRole(currentRole: UserRole, requestedRole: UserRole): boolean {
    // Users can request any role except their current one
    return currentRole !== requestedRole;
  }

  /**
   * Check if user can approve role changes
   */
  static canApproveRoleChanges(userRole: UserRole): boolean {
    const permissions = ROLE_PERMISSIONS[userRole];
    return permissions.permissions.canApproveRoleChanges;
  }

  /**
   * Get role change statistics
   */
  static async getRoleChangeStatistics(): Promise<{
    total: number;
    pending: number;
    approved: number;
    denied: number;
  }> {
    return await RoleChangeRequestModel.getStatistics();
  }

  /**
   * Cancel a pending role change request
   * Requirements: 2.8
   */
  static async cancelRoleRequest(requestId: string, userId: string): Promise<void> {
    const request = await RoleChangeRequestModel.findById(requestId);
    if (!request) {
      throw new Error('Role change request not found');
    }

    if (request.userId !== userId) {
      throw new Error('You can only cancel your own role change requests');
    }

    if (request.status !== ROLE_CHANGE_STATUS.PENDING) {
      throw new Error('Can only cancel pending role change requests');
    }

    await RoleChangeRequestModel.delete(requestId);
  }

  /**
   * Validate role change request data
   */
  static validateRoleChangeRequest(data: RoleChangeRequestData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.userId) {
      errors.push('User ID is required');
    }

    if (!data.requestedRole) {
      errors.push('Requested role is required');
    } else if (!Object.values(USER_ROLES).includes(data.requestedRole)) {
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
   * Notify administrators about new role change request
   * Requirements: 2.6
   */
  private static async notifyAdministratorsOfNewRequest(
    request: AppwriteRoleChangeRequest, 
    user: AppwriteUser
  ): Promise<void> {
    try {
      // Get all administrators (CEO and MANAGER roles)
      const { users: administrators } = await UserModel.findMany();
      const adminUsers = administrators.filter(admin => 
        this.canApproveRoleChanges(admin.role)
      );

      // Create notifications for each administrator
      for (const admin of adminUsers) {
        await NotificationService.createNotification({
          userId: admin.$id,
          type: NOTIFICATION_TYPES.COMPANY_MILESTONE, // Using existing type for now
          title: 'New Role Change Request',
          message: `${user.username} has requested a role change from ${request.currentRole} to ${request.requestedRole}`,
          scheduledFor: new Date(),
        });
      }
    } catch (error) {
      console.error('Error notifying administrators of new role request:', error);
      // Don't throw error as this is not critical for the main operation
    }
  }

  /**
   * Notify user about role change decision
   * Requirements: 3.5
   */
  private static async notifyUserOfDecision(
    request: AppwriteRoleChangeRequest, 
    action: 'approve' | 'deny'
  ): Promise<void> {
    try {
      const title = action === 'approve' ? 'Role Change Approved' : 'Role Change Denied';
      const message = action === 'approve' 
        ? `Your role change request to ${request.requestedRole} has been approved`
        : `Your role change request to ${request.requestedRole} has been denied`;

      await NotificationService.createNotification({
        userId: request.userId,
        type: NOTIFICATION_TYPES.COMPANY_MILESTONE, // Using existing type for now
        title,
        message,
        scheduledFor: new Date(),
      });
    } catch (error) {
      console.error('Error notifying user of role change decision:', error);
      // Don't throw error as this is not critical for the main operation
    }
  }
}