import { databases, COLLECTIONS, generateId, USER_ROLES, type UserRole } from '../config/appwrite';
import { Query } from 'appwrite';

export interface AppwriteRoleChangeRequest {
  $id: string;
  userId: string;
  currentRole: UserRole;
  requestedRole: UserRole;
  justification: string;
  status: RoleChangeStatus;
  submittedAt: string;
  processedAt?: string;
  processedBy?: string;
  adminNotes?: string;
  $createdAt: string;
  $updatedAt: string;
}

export interface CreateRoleChangeRequestData {
  userId: string;
  currentRole: UserRole;
  requestedRole: UserRole;
  justification: string;
}

export interface UpdateRoleChangeRequestData {
  status?: RoleChangeStatus;
  processedAt?: string;
  processedBy?: string;
  adminNotes?: string;
}

export const ROLE_CHANGE_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  DENIED: 'DENIED',
} as const;

export type RoleChangeStatus = typeof ROLE_CHANGE_STATUS[keyof typeof ROLE_CHANGE_STATUS];

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

export class RoleChangeRequestModel {
  private static databaseId = process.env.APPWRITE_DATABASE_ID || 'client-management';
  private static collectionId = 'role_change_requests';

  /**
   * Create a new role change request
   */
  static async create(data: CreateRoleChangeRequestData): Promise<AppwriteRoleChangeRequest> {
    const requestData = {
      userId: data.userId,
      currentRole: data.currentRole,
      requestedRole: data.requestedRole,
      justification: data.justification,
      status: ROLE_CHANGE_STATUS.PENDING,
      submittedAt: new Date().toISOString(),
    };

    return await databases.createDocument(
      this.databaseId,
      this.collectionId,
      generateId(),
      requestData
    ) as unknown as AppwriteRoleChangeRequest;
  }

  /**
   * Find role change request by ID
   */
  static async findById(id: string): Promise<AppwriteRoleChangeRequest | null> {
    try {
      return await databases.getDocument(
        this.databaseId,
        this.collectionId,
        id
      ) as unknown as AppwriteRoleChangeRequest;
    } catch (error: any) {
      if (error.code === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Find pending role change request for a user
   */
  static async findPendingByUserId(userId: string): Promise<AppwriteRoleChangeRequest | null> {
    try {
      const response = await databases.listDocuments(
        this.databaseId,
        this.collectionId,
        [
          Query.equal('userId', userId),
          Query.equal('status', ROLE_CHANGE_STATUS.PENDING)
        ]
      );
      
      return response.documents.length > 0 ? response.documents[0] as unknown as AppwriteRoleChangeRequest : null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find all role change requests for a user
   */
  static async findByUserId(userId: string): Promise<AppwriteRoleChangeRequest[]> {
    try {
      const response = await databases.listDocuments(
        this.databaseId,
        this.collectionId,
        [
          Query.equal('userId', userId),
          Query.orderDesc('$createdAt')
        ]
      );
      
      return response.documents as unknown as AppwriteRoleChangeRequest[];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find all pending role change requests
   */
  static async findPending(): Promise<AppwriteRoleChangeRequest[]> {
    try {
      const response = await databases.listDocuments(
        this.databaseId,
        this.collectionId,
        [
          Query.equal('status', ROLE_CHANGE_STATUS.PENDING),
          Query.orderDesc('$createdAt')
        ]
      );
      
      return response.documents as unknown as AppwriteRoleChangeRequest[];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update role change request
   */
  static async update(id: string, data: UpdateRoleChangeRequestData): Promise<AppwriteRoleChangeRequest> {
    const updateData = {
      ...data,
    };

    return await databases.updateDocument(
      this.databaseId,
      this.collectionId,
      id,
      updateData
    ) as unknown as AppwriteRoleChangeRequest;
  }

  /**
   * Process role change request (approve or deny)
   */
  static async process(
    id: string, 
    action: 'approve' | 'deny', 
    processedBy: string, 
    adminNotes?: string
  ): Promise<AppwriteRoleChangeRequest> {
    const status = action === 'approve' ? ROLE_CHANGE_STATUS.APPROVED : ROLE_CHANGE_STATUS.DENIED;
    
    const updateData: UpdateRoleChangeRequestData = {
      status,
      processedAt: new Date().toISOString(),
      processedBy,
    };

    if (adminNotes !== undefined) {
      updateData.adminNotes = adminNotes;
    }
    
    return await this.update(id, updateData);
  }

  /**
   * Delete role change request
   */
  static async delete(id: string): Promise<void> {
    await databases.deleteDocument(
      this.databaseId,
      this.collectionId,
      id
    );
  }

  /**
   * Find all role change requests with pagination and filtering
   */
  static async findMany(options: {
    limit?: number;
    offset?: number;
    status?: RoleChangeStatus;
    userId?: string;
  } = {}): Promise<{ requests: AppwriteRoleChangeRequest[]; total: number }> {
    const queries = [];
    
    if (options.status) {
      queries.push(Query.equal('status', options.status));
    }
    
    if (options.userId) {
      queries.push(Query.equal('userId', options.userId));
    }
    
    if (options.limit) {
      queries.push(Query.limit(options.limit));
    }
    
    if (options.offset) {
      queries.push(Query.offset(options.offset));
    }

    queries.push(Query.orderDesc('$createdAt'));

    const response = await databases.listDocuments(
      this.databaseId,
      this.collectionId,
      queries
    );

    return {
      requests: response.documents as unknown as AppwriteRoleChangeRequest[],
      total: response.total,
    };
  }

  /**
   * Check if user has pending role change request
   */
  static async hasPendingRequest(userId: string): Promise<boolean> {
    const pendingRequest = await this.findPendingByUserId(userId);
    return pendingRequest !== null;
  }

  /**
   * Get role change statistics
   */
  static async getStatistics(): Promise<{
    total: number;
    pending: number;
    approved: number;
    denied: number;
  }> {
    const [allRequests, pendingRequests, approvedRequests, deniedRequests] = await Promise.all([
      this.findMany(),
      this.findMany({ status: ROLE_CHANGE_STATUS.PENDING }),
      this.findMany({ status: ROLE_CHANGE_STATUS.APPROVED }),
      this.findMany({ status: ROLE_CHANGE_STATUS.DENIED }),
    ]);

    return {
      total: allRequests.total,
      pending: pendingRequests.total,
      approved: approvedRequests.total,
      denied: deniedRequests.total,
    };
  }
}

/**
 * Role permissions configuration
 */
export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  [USER_ROLES.CEO]: {
    role: USER_ROLES.CEO,
    permissions: {
      canManageCompanies: true,
      canScheduleAudits: true,
      canViewAllAudits: true,
      canManageUsers: true,
      canApproveRoleChanges: true,
      canViewReports: true,
    },
    description: 'Full access to all system features and administrative functions',
  },
  [USER_ROLES.MANAGER]: {
    role: USER_ROLES.MANAGER,
    permissions: {
      canManageCompanies: true,
      canScheduleAudits: true,
      canViewAllAudits: true,
      canManageUsers: false,
      canApproveRoleChanges: true,
      canViewReports: true,
    },
    description: 'Can manage companies, schedule audits, and approve role changes',
  },
  [USER_ROLES.TEAM_MEMBER]: {
    role: USER_ROLES.TEAM_MEMBER,
    permissions: {
      canManageCompanies: false,
      canScheduleAudits: false,
      canViewAllAudits: false,
      canManageUsers: false,
      canApproveRoleChanges: false,
      canViewReports: false,
    },
    description: 'Basic access to assigned tasks and personal dashboard',
  },
};