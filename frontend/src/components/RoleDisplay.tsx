import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Alert,
  CircularProgress,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
} from '@mui/material';

import {
  Person,
  CheckCircle,
  Cancel,
  Schedule,
  Security,
  Business,
  Assignment,
  Visibility,
  People,
  BarChart,
  ExpandMore,
  Info,
  Star,
  WorkspacePremium,
  Groups,
} from '@mui/icons-material';
import { RoleService } from '../services/roleService';
import { useAuth } from '../hooks/useAuth';
import type {
  RoleChangeRequest,
  RolePermissions,
  UserRole,
} from '../types/role';

interface RoleDisplayProps {
  onRequestRole?: () => void;
  showRequestButton?: boolean;
}

export const RoleDisplay: React.FC<RoleDisplayProps> = ({
  onRequestRole,
  showRequestButton = true,
}) => {
  const { user } = useAuth();
  const [pendingRequest, setPendingRequest] =
    useState<RoleChangeRequest | null>(null);
  const [rolePermissions, setRolePermissions] =
    useState<RolePermissions | null>(null);
  const [allRolePermissions, setAllRolePermissions] = useState<
    RolePermissions[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRoleData();
  }, [user]);

  const loadRoleData = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // Load pending request, current role permissions, and all role permissions in parallel
      const [pendingResponse, permissionsResponse, allPermissionsResponse] =
        await Promise.all([
          RoleService.getUserPendingRequest(),
          RoleService.getRolePermissions(user.role),
          RoleService.getAllRolePermissions(),
        ]);

      if ('success' in pendingResponse && pendingResponse.success) {
        setPendingRequest(pendingResponse.data);
      }

      if ('success' in permissionsResponse && permissionsResponse.success) {
        setRolePermissions(permissionsResponse.data);
      }

      if (
        'success' in allPermissionsResponse &&
        allPermissionsResponse.success
      ) {
        setAllRolePermissions(allPermissionsResponse.data);
      }
    } catch (err) {
      setError('Failed to load role information');
      console.error('Error loading role data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Schedule color="warning" />;
      case 'APPROVED':
        return <CheckCircle color="success" />;
      case 'DENIED':
        return <Cancel color="error" />;
      default:
        return <Schedule />;
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'CEO':
        return <WorkspacePremium />;
      case 'MANAGER':
        return <Star />;
      case 'TEAM_MEMBER':
        return <Groups />;
      default:
        return <Person />;
    }
  };

  const getRoleColor = (
    role: UserRole
  ):
    | 'default'
    | 'primary'
    | 'secondary'
    | 'error'
    | 'info'
    | 'success'
    | 'warning' => {
    switch (role) {
      case 'CEO':
        return 'error'; // Red for highest authority
      case 'MANAGER':
        return 'warning'; // Orange for management
      case 'TEAM_MEMBER':
        return 'primary'; // Blue for team members
      default:
        return 'default';
    }
  };

  const getRoleHierarchyLevel = (role: UserRole): number => {
    switch (role) {
      case 'CEO':
        return 3;
      case 'MANAGER':
        return 2;
      case 'TEAM_MEMBER':
        return 1;
      default:
        return 0;
    }
  };

  const getPermissionIcon = (permission: string) => {
    switch (permission) {
      case 'canManageCompanies':
        return <Business />;
      case 'canScheduleAudits':
      case 'canViewAllAudits':
        return <Assignment />;
      case 'canManageUsers':
        return <People />;
      case 'canApproveRoleChanges':
        return <Security />;
      case 'canViewReports':
        return <BarChart />;
      default:
        return <Visibility />;
    }
  };

  const getPermissionLabel = (permission: string) => {
    switch (permission) {
      case 'canManageCompanies':
        return 'Manage Companies';
      case 'canScheduleAudits':
        return 'Schedule Audits';
      case 'canViewAllAudits':
        return 'View All Audits';
      case 'canManageUsers':
        return 'Manage Users';
      case 'canApproveRoleChanges':
        return 'Approve Role Changes';
      case 'canViewReports':
        return 'View Reports';
      default:
        return permission;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight={200}
          >
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">User information not available</Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" component="h2" gutterBottom>
          <Person sx={{ mr: 1, verticalAlign: 'middle' }} />
          Role Information
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Current Role Section */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Current Role
          </Typography>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              flexWrap: 'wrap',
            }}
          >
            <Chip
              label={RoleService.getRoleDisplayName(user.role)}
              color={getRoleColor(user.role)}
              size="medium"
              icon={getRoleIcon(user.role)}
              sx={{ fontSize: '1rem', py: 2 }}
            />
            <Box sx={{ flex: 1, minWidth: '200px' }}>
              {rolePermissions && (
                <Box>
                  <Typography
                    variant="body1"
                    color="text.primary"
                    sx={{ fontWeight: 500 }}
                  >
                    {rolePermissions.description}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Hierarchy Level: {getRoleHierarchyLevel(user.role)} of 3
                  </Typography>
                </Box>
              )}
            </Box>
            <Tooltip title="Role information and permissions">
              <Info color="action" />
            </Tooltip>
          </Box>
        </Box>

        {/* Pending Request Section */}
        {pendingRequest && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Pending Role Change Request
            </Typography>
            <Alert
              severity="info"
              icon={getStatusIcon(pendingRequest.status)}
              sx={{ mb: 2 }}
            >
              <Typography variant="body2">
                <strong>Requested Role:</strong>{' '}
                {RoleService.getRoleDisplayName(pendingRequest.requestedRole)}
              </Typography>
              <Typography variant="body2">
                <strong>Status:</strong>{' '}
                {RoleService.getStatusDisplayName(pendingRequest.status)}
              </Typography>
              <Typography variant="body2">
                <strong>Submitted:</strong>{' '}
                {new Date(pendingRequest.submittedAt).toLocaleDateString()}
              </Typography>
              {pendingRequest.justification && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <strong>Justification:</strong> {pendingRequest.justification}
                </Typography>
              )}
            </Alert>
          </Box>
        )}

        {/* Role Permissions Section */}
        {rolePermissions && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Your Permissions
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Your current role grants you access to the following features and
              actions:
            </Typography>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, 1fr)',
                },
                gap: 1,
              }}
            >
              {Object.entries(rolePermissions.permissions)
                .filter(([_, hasPermission]) => hasPermission)
                .map(([permission, _]) => (
                  <Box
                    key={permission}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      p: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      bgcolor: 'success.light',
                      color: 'success.contrastText',
                    }}
                  >
                    <Box sx={{ mr: 1, color: 'success.main' }}>
                      {getPermissionIcon(permission)}
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {getPermissionLabel(permission)}
                    </Typography>
                  </Box>
                ))}
            </Box>

            {/* Show denied permissions */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Permissions not available to your role:
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, 1fr)',
                  },
                  gap: 1,
                }}
              >
                {Object.entries(rolePermissions.permissions)
                  .filter(([_, hasPermission]) => !hasPermission)
                  .map(([permission, _]) => (
                    <Box
                      key={permission}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        p: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        bgcolor: 'grey.100',
                        color: 'text.disabled',
                      }}
                    >
                      <Box sx={{ mr: 1, color: 'text.disabled' }}>
                        {getPermissionIcon(permission)}
                      </Box>
                      <Typography variant="body2">
                        {getPermissionLabel(permission)}
                      </Typography>
                    </Box>
                  ))}
              </Box>
            </Box>
          </Box>
        )}

        {/* Role Descriptions and Help Section */}
        {allRolePermissions.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6">
                  Role Descriptions & Hierarchy
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Understanding the different roles and their capabilities in
                  the system:
                </Typography>

                {allRolePermissions
                  .sort(
                    (a, b) =>
                      getRoleHierarchyLevel(b.role) -
                      getRoleHierarchyLevel(a.role)
                  )
                  .map((roleInfo) => (
                    <Box key={roleInfo.role} sx={{ mb: 3 }}>
                      <Box
                        display="flex"
                        alignItems="center"
                        gap={1}
                        sx={{ mb: 1 }}
                      >
                        <Chip
                          label={RoleService.getRoleDisplayName(roleInfo.role)}
                          color={getRoleColor(roleInfo.role)}
                          size="small"
                          icon={getRoleIcon(roleInfo.role)}
                        />
                        {roleInfo.role === user.role && (
                          <Chip
                            label="Your Role"
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>

                      <Typography variant="body2" paragraph>
                        {roleInfo.description}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 1 }}
                      >
                        <strong>Permissions:</strong>
                      </Typography>

                      <Box
                        sx={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: 0.5,
                          mb: 2,
                        }}
                      >
                        {Object.entries(roleInfo.permissions)
                          .filter(([_, hasPermission]) => hasPermission)
                          .map(([permission, _]) => (
                            <Chip
                              key={permission}
                              label={getPermissionLabel(permission)}
                              size="small"
                              variant="outlined"
                              icon={getPermissionIcon(permission)}
                            />
                          ))}
                      </Box>

                      {roleInfo.role !==
                        allRolePermissions[allRolePermissions.length - 1]
                          .role && <Divider sx={{ mt: 2 }} />}
                    </Box>
                  ))}
              </AccordionDetails>
            </Accordion>
          </Box>
        )}

        <Divider sx={{ mb: 3 }} />

        {/* Request Role Change Button */}
        {showRequestButton && !pendingRequest && onRequestRole && (
          <Box display="flex" justifyContent="flex-end">
            <Button
              variant="outlined"
              onClick={onRequestRole}
              startIcon={<Security />}
            >
              Request Role Change
            </Button>
          </Box>
        )}

        {/* Message when user has pending request */}
        {pendingRequest && (
          <Box display="flex" justifyContent="center">
            <Typography variant="body2" color="text.secondary">
              You cannot submit a new role change request while one is pending.
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};
