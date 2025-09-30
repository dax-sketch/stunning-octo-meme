import React, { Suspense } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

// Loading fallback component
const LoadingFallback: React.FC<{ message?: string }> = ({
  message = 'Loading...',
}) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 200,
      gap: 2,
    }}
  >
    <CircularProgress />
    <Typography variant="body2" color="text.secondary">
      {message}
    </Typography>
  </Box>
);

// Lazy loaded components
export const LazyDashboardPage = React.lazy(() =>
  import('../pages/DashboardPage').then((module) => ({
    default: module.DashboardPage,
  }))
);

export const LazyCompaniesPage = React.lazy(() =>
  import('../pages/CompaniesPage').then((module) => ({
    default: module.CompaniesPage,
  }))
);

export const LazyUserSettingsPage = React.lazy(() =>
  import('../pages/UserSettingsPage').then((module) => ({
    default: module.UserSettingsPage,
  }))
);

// HOC for wrapping lazy components with Suspense
export const withLazyLoading = <P extends object>(
  Component: React.ComponentType<P>,
  loadingMessage?: string
) => {
  return (props: P) => (
    <Suspense fallback={<LoadingFallback message={loadingMessage} />}>
      <Component {...props} />
    </Suspense>
  );
};

// Pre-configured lazy components with Suspense
export const DashboardPageLazy = withLazyLoading(
  LazyDashboardPage,
  'Loading dashboard...'
);
export const CompaniesPageLazy = withLazyLoading(
  LazyCompaniesPage,
  'Loading companies...'
);
export const UserSettingsPageLazy = withLazyLoading(
  LazyUserSettingsPage,
  'Loading settings...'
);
