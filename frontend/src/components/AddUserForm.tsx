import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  PersonAdd as PersonAddIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  userManagementService,
  CreateUserData,
} from '../services/userManagementService';

interface AddUserFormData {
  email: string;
  password: string;
  username: string;
  role: 'CEO' | 'MANAGER' | 'TEAM_MEMBER';
}

interface CreatedUserInfo {
  email: string;
  password: string;
  username: string;
  role: string;
}

export const AddUserForm: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState<AddUserFormData>({
    email: '',
    password: '',
    username: '',
    role: 'TEAM_MEMBER',
  });
  const [errors, setErrors] = useState<Partial<AddUserFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [createdUser, setCreatedUser] = useState<CreatedUserInfo | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  // Check if user has permission to add users
  const canAddUsers = user?.role === 'CEO' || user?.role === 'MANAGER';

  if (!canAddUsers) {
    return (
      <Box sx={{ maxWidth: 600, mx: 'auto', p: 3 }}>
        <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" color="error" gutterBottom>
            Access Denied
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            You don't have permission to add new users. Only CEOs and Managers
            can add users.
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/dashboard')}
            startIcon={<ArrowBackIcon />}
          >
            Back to Dashboard
          </Button>
        </Paper>
      </Box>
    );
  }

  const generatePassword = () => {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({ ...prev, password }));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<AddUserFormData> = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    // Password validation
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const userData: CreateUserData = {
        email: formData.email,
        password: formData.password,
        username: formData.username,
        role: formData.role,
      };

      const response = await userManagementService.createUser(userData);

      if (response.success && response.data) {
        const newUser: CreatedUserInfo = {
          email: formData.email,
          password: formData.password,
          username: formData.username,
          role: formData.role,
        };

        setCreatedUser(newUser);
        setShowSuccessDialog(true);

        // Reset form
        setFormData({
          email: '',
          password: '',
          username: '',
          role: 'TEAM_MEMBER',
        });
      } else {
        setSubmitError(response.error?.message || 'Failed to create user');
      }
    } catch (error) {
      setSubmitError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFieldChange = (field: keyof AddUserFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const copyAllCredentials = () => {
    if (createdUser) {
      const credentials = `Login Credentials:
Email: ${createdUser.email}
Password: ${createdUser.password}
Username: ${createdUser.username}
Role: ${createdUser.role}`;
      navigator.clipboard.writeText(credentials);
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/dashboard')}
          sx={{ mr: 2 }}
        >
          Back to Dashboard
        </Button>
      </Box>

      <Paper elevation={2} sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <PersonAddIcon sx={{ fontSize: 32, color: 'primary.main', mr: 2 }} />
          <Typography variant="h6">Create User Account</Typography>
        </Box>

        {submitError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {submitError}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Email */}
            <TextField
              fullWidth
              label="Email Address *"
              type="email"
              value={formData.email}
              onChange={(e) => handleFieldChange('email', e.target.value)}
              error={!!errors.email}
              helperText={errors.email}
            />

            {/* Username */}
            <TextField
              fullWidth
              label="Username *"
              value={formData.username}
              onChange={(e) => handleFieldChange('username', e.target.value)}
              error={!!errors.username}
              helperText={errors.username}
            />

            {/* Role */}
            <FormControl fullWidth>
              <InputLabel>Role *</InputLabel>
              <Select
                value={formData.role}
                onChange={(e) => handleFieldChange('role', e.target.value)}
                label="Role *"
              >
                <MenuItem value="TEAM_MEMBER">Team Member</MenuItem>
                <MenuItem value="MANAGER">Manager</MenuItem>
                {user?.role === 'CEO' && <MenuItem value="CEO">CEO</MenuItem>}
              </Select>
            </FormControl>

            {/* Password */}
            <Box>
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                  fullWidth
                  label="Password *"
                  type="text"
                  value={formData.password}
                  onChange={(e) =>
                    handleFieldChange('password', e.target.value)
                  }
                  error={!!errors.password}
                  helperText={errors.password}
                />
                <Button
                  variant="outlined"
                  onClick={generatePassword}
                  sx={{ minWidth: 'auto', px: 2 }}
                >
                  Generate
                </Button>
              </Box>
              <Typography variant="caption" color="text.secondary">
                Password will be visible to copy and share with the new user
              </Typography>
            </Box>

            {/* Submit Button */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/dashboard')}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting}
                startIcon={
                  isSubmitting ? (
                    <CircularProgress size={20} />
                  ) : (
                    <PersonAddIcon />
                  )
                }
              >
                {isSubmitting ? 'Creating User...' : 'Create User'}
              </Button>
            </Box>
          </Box>
        </form>
      </Paper>

      {/* Success Dialog */}
      <Dialog
        open={showSuccessDialog}
        onClose={() => setShowSuccessDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonAddIcon color="success" />
            User Created Successfully!
          </Box>
        </DialogTitle>
        <DialogContent>
          {createdUser && (
            <Box>
              <Typography variant="body1" gutterBottom>
                Here are the login credentials for the new user:
              </Typography>

              <Paper sx={{ p: 2, mt: 2, backgroundColor: 'grey.50' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Typography variant="body2">
                      <strong>Email:</strong> {createdUser.email}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => copyToClipboard(createdUser.email)}
                    >
                      <CopyIcon fontSize="small" />
                    </IconButton>
                  </Box>

                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Typography variant="body2">
                      <strong>Password:</strong> {createdUser.password}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => copyToClipboard(createdUser.password)}
                    >
                      <CopyIcon fontSize="small" />
                    </IconButton>
                  </Box>

                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Typography variant="body2">
                      <strong>Username:</strong> {createdUser.username}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => copyToClipboard(createdUser.username)}
                    >
                      <CopyIcon fontSize="small" />
                    </IconButton>
                  </Box>

                  <Typography variant="body2">
                    <strong>Role:</strong> {createdUser.role}
                  </Typography>
                </Box>
              </Paper>

              <Alert severity="info" sx={{ mt: 2 }}>
                Please copy these credentials and share them securely with the
                new user. They will need this information to log in.
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={copyAllCredentials} startIcon={<CopyIcon />}>
            Copy All Credentials
          </Button>
          <Button
            onClick={() => setShowSuccessDialog(false)}
            variant="contained"
          >
            Done
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
