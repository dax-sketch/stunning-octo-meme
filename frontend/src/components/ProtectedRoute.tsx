import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'CEO' | 'MANAGER' | 'TEAM_MEMBER';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="50vh"
        gap={2}
      >
        <CircularProgress />
        <Typography variant="body1">Loading...</Typography>
      </Box>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access if required
  if (requiredRole && user?.role !== requiredRole) {
    // For role-based restrictions, you might want to show an access denied page
    // For now, we'll redirect to a dashboard or show an error
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="50vh"
        gap={2}
      >
        <Typography variant="h5" color="error">
          Access Denied
        </Typography>
        <Typography variant="body1">
          You don't have permission to access this page.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Required role: {requiredRole}, Your role: {user?.role}
        </Typography>
      </Box>
    );
  }

  return <>{children}</>;
};
