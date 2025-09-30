# Design Document

## Overview

This design addresses the dashboard quick actions navigation issues and implements a comprehensive role change management system. The solution involves creating missing page components, implementing proper routing, and adding role change request functionality with administrative approval workflows.

## Architecture

### Component Architecture
```
Pages/
├── CompaniesPage.tsx (new)
├── AuditsPage.tsx (new) 
├── NotificationsPage.tsx (new)
└── RoleManagementPage.tsx (new)

Components/
├── RoleChangeRequest.tsx (new)
├── RoleChangeAdmin.tsx (new)
├── RoleDisplay.tsx (new)
├── CompanyList.tsx (enhanced)
├── AuditList.tsx (new)
└── NotificationList.tsx (new)

Services/
├── roleService.ts (new)
├── auditService.ts (enhanced)
└── notificationService.ts (enhanced)
```

### Data Flow
1. **Quick Actions**: Dashboard → Router → New Pages → Services → Backend
2. **Role Requests**: User Profile → Role Request Form → Role Service → Backend → Admin Notifications
3. **Role Administration**: Admin Dashboard → Role Admin Component → Role Service → Backend → User Notifications

## Components and Interfaces

### 1. New Page Components

#### CompaniesPage
- Displays paginated list of companies
- Includes search and filter functionality
- Provides "Add Company" action button
- Integrates with existing CompanyList component

#### AuditsPage  
- Shows scheduled, completed, and overdue audits
- Provides audit scheduling functionality
- Includes calendar view for audit timeline
- Filters by date range and status

#### NotificationsPage
- Displays user notifications with read/unread status
- Provides notification preferences management
- Includes notification history and search
- Allows marking notifications as read/unread

#### RoleManagementPage (Admin only)
- Lists pending role change requests
- Provides approval/denial interface
- Shows role change history and audit logs
- Includes user role overview dashboard

### 2. Role Management Components

#### RoleChangeRequest
```typescript
interface RoleChangeRequestProps {
  currentRole: string;
  onRequestSubmitted: () => void;
}

interface RoleChangeFormData {
  requestedRole: 'CEO' | 'MANAGER' | 'TEAM_MEMBER';
  justification: string;
}
```

#### RoleChangeAdmin
```typescript
interface RoleChangeAdminProps {
  requests: RoleChangeRequest[];
  onRequestProcessed: (requestId: string, action: 'approve' | 'deny', reason?: string) => void;
}

interface RoleChangeRequest {
  id: string;
  userId: string;
  username: string;
  currentRole: string;
  requestedRole: string;
  justification: string;
  status: 'pending' | 'approved' | 'denied';
  submittedAt: string;
  processedAt?: string;
  processedBy?: string;
  adminNotes?: string;
}
```

#### RoleDisplay
```typescript
interface RoleDisplayProps {
  user: User;
  pendingRequest?: RoleChangeRequest;
  showRequestButton?: boolean;
  onRequestRole?: () => void;
}
```

### 3. Enhanced Services

#### RoleService
```typescript
class RoleService {
  static async requestRoleChange(data: RoleChangeRequestData): Promise<ApiResponse>;
  static async getPendingRequests(): Promise<ApiResponse<RoleChangeRequest[]>>;
  static async processRoleRequest(requestId: string, action: 'approve' | 'deny', adminNotes?: string): Promise<ApiResponse>;
  static async getUserRoleRequest(userId: string): Promise<ApiResponse<RoleChangeRequest>>;
  static async getRolePermissions(role: string): Promise<ApiResponse<RolePermissions>>;
}
```

#### Enhanced AuditService
```typescript
interface AuditService {
  getAudits(filters?: AuditFilters): Promise<ApiResponse<Audit[]>>;
  scheduleAudit(auditData: CreateAuditData): Promise<ApiResponse<Audit>>;
  updateAuditStatus(auditId: string, status: AuditStatus): Promise<ApiResponse>;
}
```

## Data Models

### Role Change Request Model
```typescript
interface RoleChangeRequest {
  id: string;
  userId: string;
  currentRole: UserRole;
  requestedRole: UserRole;
  justification: string;
  status: 'pending' | 'approved' | 'denied';
  submittedAt: Date;
  processedAt?: Date;
  processedBy?: string;
  adminNotes?: string;
}
```

### Role Permissions Model
```typescript
interface RolePermissions {
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
```

### Audit Model
```typescript
interface Audit {
  id: string;
  companyId: string;
  companyName: string;
  scheduledDate: Date;
  completedDate?: Date;
  status: 'scheduled' | 'in_progress' | 'completed' | 'overdue';
  assignedTo: string;
  auditType: string;
  notes?: string;
}
```

## Error Handling

### Navigation Error Handling
- Implement route guards for protected pages
- Provide fallback components for failed route loads
- Display user-friendly error messages for navigation failures
- Implement retry mechanisms for failed page loads

### Role Change Error Handling
- Validate role change requests on both client and server
- Handle duplicate request submissions gracefully
- Provide clear error messages for invalid role transitions
- Implement rollback mechanisms for failed role updates

### Permission Error Handling
- Check user permissions before displaying admin features
- Gracefully handle permission denied scenarios
- Provide informative messages about required permissions
- Implement proper authentication checks for sensitive operations

## Testing Strategy

### Unit Testing
- Test all new components with React Testing Library
- Mock service calls and test error scenarios
- Test form validation and user interactions
- Verify proper role-based rendering

### Integration Testing
- Test complete role change workflow end-to-end
- Verify navigation between all new pages
- Test admin approval/denial processes
- Validate notification delivery for role changes

### User Acceptance Testing
- Test quick actions navigation from dashboard
- Verify role change request submission process
- Test admin role change approval workflow
- Validate proper permission enforcement

## Security Considerations

### Role-Based Access Control
- Implement server-side role validation for all endpoints
- Verify user permissions before displaying sensitive data
- Use JWT tokens with role information for authentication
- Implement proper session management for role changes

### Data Validation
- Validate all role change requests on server side
- Sanitize user input in justification fields
- Implement rate limiting for role change requests
- Audit all role changes for security monitoring

### Authorization Checks
- Verify admin permissions before allowing role approvals
- Implement proper CSRF protection for forms
- Use secure HTTP headers for all API requests
- Validate user identity for all sensitive operations