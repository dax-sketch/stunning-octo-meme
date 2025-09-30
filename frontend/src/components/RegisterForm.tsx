import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useAuth } from '../hooks/useAuth';
import { RegisterData } from '../types/auth';

interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onSuccess,
  onSwitchToLogin,
}) => {
  const { register, isLoading } = useAuth();
  const [formData, setFormData] = useState<RegisterData>({
    username: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Partial<RegisterData>>({});
  const [submitError, setSubmitError] = useState<string>('');

  const validateForm = (): boolean => {
    const newErrors: Partial<RegisterData> = {};

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone number validation
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!phoneRegex.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange =
    (field: keyof RegisterData) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({
        ...prev,
        [field]: event.target.value,
      }));

      // Clear field error when user starts typing
      if (errors[field]) {
        setErrors((prev) => ({
          ...prev,
          [field]: undefined,
        }));
      }

      // Clear submit error
      if (submitError) {
        setSubmitError('');
      }
    };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await register(formData);
      onSuccess?.();
    } catch (error: any) {
      setSubmitError(error.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 400, mx: 'auto' }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Register
      </Typography>

      {submitError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {submitError}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <TextField
          fullWidth
          label="Username"
          value={formData.username}
          onChange={handleInputChange('username')}
          error={!!errors.username}
          helperText={errors.username}
          margin="normal"
          required
          autoComplete="username"
          autoFocus
        />

        <TextField
          fullWidth
          label="Email Address"
          type="email"
          value={formData.email}
          onChange={handleInputChange('email')}
          error={!!errors.email}
          helperText={errors.email}
          margin="normal"
          required
          autoComplete="email"
        />

        <TextField
          fullWidth
          label="Phone Number"
          value={formData.phoneNumber}
          onChange={handleInputChange('phoneNumber')}
          error={!!errors.phoneNumber}
          helperText={errors.phoneNumber}
          margin="normal"
          required
          autoComplete="tel"
        />

        <TextField
          fullWidth
          label="Password"
          type="password"
          value={formData.password}
          onChange={handleInputChange('password')}
          error={!!errors.password}
          helperText={errors.password}
          margin="normal"
          required
          autoComplete="new-password"
        />

        <TextField
          fullWidth
          label="Confirm Password"
          type="password"
          value={formData.confirmPassword}
          onChange={handleInputChange('confirmPassword')}
          error={!!errors.confirmPassword}
          helperText={errors.confirmPassword}
          margin="normal"
          required
          autoComplete="new-password"
        />

        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{ mt: 3, mb: 2 }}
          disabled={isLoading}
        >
          {isLoading ? <CircularProgress size={24} /> : 'Register'}
        </Button>

        {onSwitchToLogin && (
          <Box textAlign="center">
            <Button
              variant="text"
              onClick={onSwitchToLogin}
              disabled={isLoading}
            >
              Already have an account? Login here
            </Button>
          </Box>
        )}
      </Box>
    </Paper>
  );
};
