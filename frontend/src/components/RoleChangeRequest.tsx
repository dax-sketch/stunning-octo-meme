import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Typography,
  Box,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
} from '@mui/material';
import {
  Security,
  Person,
  Business,
  Assignment,
  People,
  BarChart,
  Visibility,
  Close,
} from '@mui/icons-material';
import { RoleService } from '../services/roleService';
import { useAuth } from '../hooks/useAuth';
import type {
  UserRole,
  RoleChangeRequestData,
  RolePermissions,
} from '../types/role';

interface RoleChangeRequestProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FormData {
  requestedRole: UserRole | '';
  justification: string;
}

interface FormErrors {
  requestedRole?: string;
  justification?: string;
}

export const RoleChangeRequest: React.FC<RoleChangeRequestProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    requestedRole: '',
    justification: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [allRolePermissions, setAllRolePermissions] = useState<
    RolePermissions[]
  >([]);

  // Available roles for selection (excluding current role)
  const availableRoles: UserRole[] = ['CEO', 'MANAGER', 'TEAM_MEMBER'];

  useEffect(() => {
    if (open) {
      loadRolePermissions();
      resetForm();
    }
  }, [open]);

  const loadRolePermissions = async () => {
    setLoading(true);
    try {
      const response = await RoleService.getAllRolePermissions();
      if ('success' in response && response.success) {
        setAllRolePermissions(response.data);
      }
    } catch (error) {
      console.error('Error loading role permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      requestedRole: '',
      justification: '',
    });
    setErrors({});
    setMessage(null);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Role validation
    if (!formData.requestedRole) {
      newErrors.requestedRole = 'Please select a role';
    } else if (formData.requestedRole === user?.role) {
      newErrors.requestedRole = 'You cannot request your current role';
    }

    // Justification validation
    if (!formData.justification.trim()) {
      newErrors.justification = 'Justification is required';
    } else if (formData.justification.trim().length < 10) {
      newErrors.justification =
        'Justification must be at least 10 characters long';
    } else if (formData.justification.trim().length > 500) {
      newErrors.justification =
        'Justification must be less than 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange =
    (field: keyof FormData) =>
    (
      event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any
    ) => {
      const value = event.target.value;
      setFormData((prev) => ({ ...prev, [field]: value }));

      // Clear error when user starts typing
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }

      // Clear message when user makes changes
      if (message) {
        setMessage(null);
      }
    };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm() || !user) {
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const requestData: RoleChangeRequestData = {
        requestedRole: formData.requestedRole as UserRole,
        justification: formData.justification.trim(),
      };

      // Validate on client side first
      const validation = RoleService.validateRoleChangeRequest(requestData);
      if (!validation.isValid) {
        setMessage({
          type: 'error',
          text: validation.errors.join(', '),
        });
        return;
      }

      const response = await RoleService.requestRoleChange(requestData);

      if ('success' in response && response.success) {
        setMessage({
          type: 'success',
          text: 'Role change request submitted successfully! Administrators will review your request.',
        });

        // Call success callback after a short delay to show success message
        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          }
          onClose();
        }, 2000);
      } else {
        setMessage({
          type: 'error',
          text:
            'error' in response
              ? response.error.message
              : 'Failed to submit role change request',
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'An unexpected error occurred. Please try again.',
      });
      console.error('Error submitting role change request:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      onClose();
    }
  };

  const getSelectedRolePermissions = (): RolePermissions | null => {
    if (!formData.requestedRole) return null;
    return (
      allRolePermissions.find((rp) => rp.role === formData.requestedRole) ||
      null
    );
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

  const selectedRolePermissions = getSelectedRolePermissions();

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        component: 'form',
        onSubmit: handleSubmit,
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center">
            <Security sx={{ mr: 1 }} />
            Request Role Change
          </Box>
          <Button
            onClick={handleClose}
            disabled={submitting}
            size="small"
            sx={{ minWidth: 'auto', p: 1 }}
          >
            <Close />
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {loading && (
          <Box display="flex" justifyContent="center" py={3}>
            <CircularProgress />
          </Box>
        )}

        {!loading && (
          <>
            {message && (
              <Alert severity={message.type} sx={{ mb: 3 }}>
                {message.text}
              </Alert>
            )}

            {/* Current Role Display */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Current Role
              </Typography>
              <Chip
                label={
                  user ? RoleService.getRoleDisplayName(user.role) : 'Unknown'
                }
                color="primary"
                icon={<Person />}
              />
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Role Selection */}
            <FormControl
              fullWidth
              sx={{ mb: 3 }}
              error={!!errors.requestedRole}
            >
              <InputLabel>Requested Role</InputLabel>
              <Select
                value={formData.requestedRole}
                onChange={handleInputChange('requestedRole')}
                label="Requested Role"
                disabled={submitting}
              >
                {availableRoles
                  .filter((role) => role !== user?.role)
                  .map((role) => (
                    <MenuItem key={role} value={role}>
                      {RoleService.getRoleDisplayName(role)}
                    </MenuItem>
                  ))}
              </Select>
              {errors.requestedRole && (
                <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                  {errors.requestedRole}
                </Typography>
              )}
            </FormControl>

            {/* Role Permissions Preview */}
            {selectedRolePermissions && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Role Permissions
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {selectedRolePermissions.description}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  This role will allow you to:
                </Typography>
                <List dense>
                  {Object.entries(selectedRolePermissions.permissions)
                    .filter(([_, hasPermission]) => hasPermission)
                    .map(([permission, _]) => (
                      <ListItem key={permission} sx={{ py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          {getPermissionIcon(permission)}
                        </ListItemIcon>
                        <ListItemText
                          primary={getPermissionLabel(permission)}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                </List>
              </Box>
            )}

            {/* Justification Field */}
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Business Justification"
              value={formData.justification}
              onChange={handleInputChange('justification')}
              error={!!errors.justification}
              helperText={
                errors.justification ||
                `Please explain why you need this role change (${formData.justification.length}/500 characters)`
              }
              disabled={submitting}
              placeholder="Explain why you need this role change, including how it will help you perform your responsibilities better..."
              inputProps={{
                maxLength: 500,
              }}
            />
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={
            loading ||
            submitting ||
            !formData.requestedRole ||
            !formData.justification.trim()
          }
          startIcon={submitting ? <CircularProgress size={20} /> : <Security />}
        >
          {submitting ? 'Submitting...' : 'Submit Request'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
