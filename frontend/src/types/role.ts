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

export interface RoleChangeFormData {
  requestedRole: UserRole;
  justification: string;
}

export interface RoleDisplayData {
  role: UserRole;
  displayName: string;
  permissions: RolePermissions['permissions'];
  description: string;
  pendingRequest?: RoleChangeRequest;
}
