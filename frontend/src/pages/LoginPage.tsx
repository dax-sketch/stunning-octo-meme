import React from 'react';
import { Navigate } from 'react-router-dom';
import { Container, Box } from '@mui/material';
import { LoginForm } from '../components/LoginForm';
import { useAuth } from '../hooks/useAuth';

export const LoginPage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  // Redirect to dashboard if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <LoginForm
          onSuccess={() => {
            // After successful login, redirect will happen automatically
            // due to the Navigate component above checking isAuthenticated
          }}
        />
      </Box>
    </Container>
  );
};
