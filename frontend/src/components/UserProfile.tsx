import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Divider,
  IconButton,
  InputAdornment,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Person,
  Email,
  Phone,
  Lock,
} from '@mui/icons-material';
import { UserService, UpdateProfileData } from '../services/userService';
import { useAuth } from '../hooks/useAuth';
import { RoleDisplay } from './RoleDisplay';
import { RoleChangeRequest } from './RoleChangeRequest';

interface UserProfileProps {
  onProfileUpdate?: () => void;
}

interface FormData {
  username: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  username?: string;
  email?: string;
  phoneNumber?: string;
  password?: string;
  confirmPassword?: string;
}

export const UserProfile: React.FC<UserProfileProps> = ({
  onProfileUpdate,
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    username: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [roleChangeDialogOpen, setRoleChangeDialogOpen] = useState(false);
  const [roleDisplayKey, setRoleDisplayKey] = useState(0);

  // Load current user data
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        username: user.username || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
      }));
    }
  }, [user]);

  // Validation functions
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
  };

  const validatePassword = (password: string): boolean => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return passwordRegex.test(password);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters and numbers';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone number validation
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!validatePhoneNumber(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }

    // Password validation (only if password is provided)
    if (formData.password) {
      if (!validatePassword(formData.password)) {
        newErrors.password =
          'Password must be at least 8 characters with uppercase, lowercase, and number';
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange =
    (field: keyof FormData) => (event: React.ChangeEvent<HTMLInputElement>) => {
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

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // Prepare update data (only include changed fields)
      const updateData: UpdateProfileData = {};

      if (formData.username !== user?.username) {
        updateData.username = formData.username;
      }

      if (formData.email !== user?.email) {
        updateData.email = formData.email;
      }

      if (formData.phoneNumber !== user?.phoneNumber) {
        updateData.phoneNumber = formData.phoneNumber;
      }

      if (formData.password) {
        updateData.password = formData.password;
      }

      // Only make API call if there are changes
      if (Object.keys(updateData).length === 0) {
        setMessage({ type: 'error', text: 'No changes to save' });
        return;
      }

      const response = await UserService.updateProfile(updateData);

      if (response.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully' });

        // Clear password fields
        setFormData((prev) => ({ ...prev, password: '', confirmPassword: '' }));

        // Call callback if provided
        if (onProfileUpdate) {
          onProfileUpdate();
        }
      } else {
        setMessage({
          type: 'error',
          text: response.error?.message || 'Failed to update profile',
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChangeRequest = () => {
    setRoleChangeDialogOpen(true);
  };

  const handleRoleChangeSuccess = () => {
    // Force refresh of role display component
    setRoleDisplayKey((prev) => prev + 1);
    setMessage({
      type: 'success',
      text: 'Role change request submitted successfully! Administrators will review your request.',
    });
  };

  return (
    <Box>
      {/* Role Information Section */}
      <Box sx={{ mb: 3 }}>
        <RoleDisplay
          key={roleDisplayKey}
          onRequestRole={handleRoleChangeRequest}
          showRequestButton={true}
        />
      </Box>

      {/* Profile Information Section */}
      <Card>
        <CardContent>
          <Typography variant="h5" component="h2" gutterBottom>
            <Person sx={{ mr: 1, verticalAlign: 'middle' }} />
            Profile Information
          </Typography>

          <Typography variant="body2" color="text.secondary" paragraph>
            Update your account information and credentials
          </Typography>

          <Divider sx={{ mb: 3 }} />

          {message && (
            <Alert severity={message.type} sx={{ mb: 3 }}>
              {message.text}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                gap: 3,
              }}
            >
              <Box>
                <TextField
                  fullWidth
                  label="Username"
                  value={formData.username}
                  onChange={handleInputChange('username')}
                  error={!!errors.username}
                  helperText={errors.username}
                  disabled={loading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              <Box>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  error={!!errors.email}
                  helperText={errors.email}
                  disabled={loading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              <Box>
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={formData.phoneNumber}
                  onChange={handleInputChange('phoneNumber')}
                  error={!!errors.phoneNumber}
                  helperText={
                    errors.phoneNumber ||
                    'Include country code (e.g., +1 555-123-4567)'
                  }
                  disabled={loading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Phone />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              <Box>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Change Password (Optional)
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Leave blank to keep current password
                </Typography>
              </Box>

              <Box>
                <TextField
                  fullWidth
                  label="New Password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange('password')}
                  error={!!errors.password}
                  helperText={
                    errors.password ||
                    'At least 8 characters with uppercase, lowercase, and number'
                  }
                  disabled={loading}
                  inputProps={{
                    'data-testid': 'new-password-input',
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          data-testid="toggle-new-password-visibility"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              <Box>
                <TextField
                  fullWidth
                  label="Confirm New Password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleInputChange('confirmPassword')}
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword}
                  disabled={loading}
                  inputProps={{
                    'data-testid': 'confirm-password-input',
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          edge="end"
                          data-testid="toggle-confirm-password-visibility"
                        >
                          {showConfirmPassword ? (
                            <VisibilityOff />
                          ) : (
                            <Visibility />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              <Box>
                <Box
                  sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}
                >
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : null}
                  >
                    {loading ? 'Updating...' : 'Update Profile'}
                  </Button>
                </Box>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Role Change Request Dialog */}
      <RoleChangeRequest
        open={roleChangeDialogOpen}
        onClose={() => setRoleChangeDialogOpen(false)}
        onSuccess={handleRoleChangeSuccess}
      />
    </Box>
  );
};
