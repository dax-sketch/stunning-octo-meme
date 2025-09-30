import React from 'react';
import { Box, Container, Typography, Breadcrumbs, Link } from '@mui/material';
import { Settings, Home } from '@mui/icons-material';
import { UserProfile } from '../components/UserProfile';
import { NotificationSettings } from '../components/NotificationSettings';
import { useAuth } from '../hooks/useAuth';

export const UserSettingsPage: React.FC = () => {
  const { user } = useAuth();

  const handleProfileUpdate = () => {
    // Optionally refresh user data or show additional feedback
    console.log('Profile updated successfully');
  };

  const handleSettingsUpdate = () => {
    // Optionally refresh user data or show additional feedback
    console.log('Settings updated successfully');
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link
          color="inherit"
          href="/dashboard"
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <Home sx={{ mr: 0.5 }} fontSize="inherit" />
          Dashboard
        </Link>
        <Typography
          color="text.primary"
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <Settings sx={{ mr: 0.5 }} fontSize="inherit" />
          User Settings
        </Typography>
      </Breadcrumbs>

      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          User Settings
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your account profile and notification preferences
        </Typography>
        {user && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Logged in as: <strong>{user.username}</strong> ({user.role})
          </Typography>
        )}
      </Box>

      {/* Settings Content */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {/* User Profile Section */}
        <Box>
          <UserProfile onProfileUpdate={handleProfileUpdate} />
        </Box>

        {/* Notification Settings Section */}
        <Box>
          <NotificationSettings onSettingsUpdate={handleSettingsUpdate} />
        </Box>
      </Box>
    </Container>
  );
};
