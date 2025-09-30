import React from 'react';
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
import { useFormValidation } from '../hooks/useFormValidation';
import { getErrorMessage } from '../services/apiClient';
import { LoginCredentials } from '../types/auth';

interface LoginFormProps {
  onSuccess?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const { login, isLoading } = useAuth();

  const initialValues: LoginCredentials = {
    username: '',
    password: '',
  };

  const validationRules = {
    username: { required: true },
    password: { required: true },
  };

  const {
    values,
    errors,
    touched,
    setValue,
    setError,
    touchField,
    handleSubmit,
  } = useFormValidation(initialValues, validationRules);

  const onSubmit = async (formData: LoginCredentials) => {
    try {
      await login(formData);
      onSuccess?.();
    } catch (error: any) {
      setError('submit', getErrorMessage(error));
      throw error; // Re-throw to prevent form from being marked as successfully submitted
    }
  };

  const handleInputChange =
    (field: keyof LoginCredentials) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setValue(field, event.target.value);
    };

  const handleInputBlur = (field: keyof LoginCredentials) => () => {
    touchField(field);
  };

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 400, mx: 'auto' }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Login
      </Typography>

      {errors.submit && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errors.submit}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <TextField
          fullWidth
          label="Username"
          value={values.username}
          onChange={handleInputChange('username')}
          onBlur={handleInputBlur('username')}
          error={touched.username && !!errors.username}
          helperText={touched.username && errors.username}
          margin="normal"
          required
          autoComplete="username"
          autoFocus
        />

        <TextField
          fullWidth
          label="Password"
          type="password"
          value={values.password}
          onChange={handleInputChange('password')}
          onBlur={handleInputBlur('password')}
          error={touched.password && !!errors.password}
          helperText={touched.password && errors.password}
          margin="normal"
          required
          autoComplete="current-password"
        />

        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{ mt: 3, mb: 2 }}
          disabled={isLoading}
        >
          {isLoading ? <CircularProgress size={24} /> : 'Login'}
        </Button>
      </Box>
    </Paper>
  );
};
