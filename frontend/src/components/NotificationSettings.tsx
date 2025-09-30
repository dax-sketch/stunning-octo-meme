import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  FormControlLabel,
  Switch,
  Button,
  Alert,
  CircularProgress,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  FormLabel,
  RadioGroup,
  Radio,
} from '@mui/material';
import {
  Notifications,
  Email,
  Sms,
  Event,
  Assignment,
  Science,
} from '@mui/icons-material';
import {
  UserService,
  NotificationPreferences,
  TestNotificationRequest,
} from '../services/userService';
import { useAuth } from '../hooks/useAuth';

interface NotificationSettingsProps {
  onSettingsUpdate?: () => void;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  onSettingsUpdate,
}) => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailNotifications: true,
    smsNotifications: true,
    meetingReminders: true,
    auditReminders: true,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testType, setTestType] = useState<'email' | 'sms' | 'both'>('email');
  const [testLoading, setTestLoading] = useState(false);
  const [testResults, setTestResults] = useState<{
    email?: boolean;
    sms?: boolean;
  } | null>(null);

  // Load current preferences from user data
  useEffect(() => {
    if (user) {
      setPreferences({
        emailNotifications: user.notificationPreferences?.email ?? true,
        smsNotifications: user.notificationPreferences?.sms ?? true,
        meetingReminders:
          user.notificationPreferences?.meetingReminders ?? true,
        auditReminders: user.notificationPreferences?.auditReminders ?? true,
      });
    }
  }, [user]);

  const handlePreferenceChange =
    (preference: keyof NotificationPreferences) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setPreferences((prev) => ({
        ...prev,
        [preference]: event.target.checked,
      }));

      // Clear message when user makes changes
      if (message) {
        setMessage(null);
      }
    };

  const handleSavePreferences = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const response =
        await UserService.updateNotificationPreferences(preferences);

      if (response.success) {
        setMessage({
          type: 'success',
          text: 'Notification preferences updated successfully',
        });

        // Call callback if provided
        if (onSettingsUpdate) {
          onSettingsUpdate();
        }
      } else {
        setMessage({
          type: 'error',
          text:
            response.error?.message ||
            'Failed to update notification preferences',
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

  const handleTestNotification = async () => {
    setTestLoading(true);
    setTestResults(null);

    try {
      const request: TestNotificationRequest = { type: testType };
      const response = await UserService.testNotification(request);

      if (response.success && response.data) {
        setTestResults(response.data.results);
        setMessage({
          type: 'success',
          text: 'Test notification sent! Check your email/phone for the message.',
        });
      } else {
        setMessage({
          type: 'error',
          text: response.error?.message || 'Failed to send test notification',
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'An unexpected error occurred while sending test notification.',
      });
    } finally {
      setTestLoading(false);
      setTestDialogOpen(false);
    }
  };

  const getStatusChip = (enabled: boolean) => {
    return (
      <Chip
        label={enabled ? 'Enabled' : 'Disabled'}
        color={enabled ? 'success' : 'default'}
        size="small"
        sx={{ ml: 1 }}
      />
    );
  };

  const getTestResultIcon = (result: boolean | undefined) => {
    if (result === undefined) return null;
    return result ? '✅' : '❌';
  };

  return (
    <>
      <Card>
        <CardContent>
          <Typography variant="h5" component="h2" gutterBottom>
            <Notifications sx={{ mr: 1, verticalAlign: 'middle' }} />
            Notification Settings
          </Typography>

          <Typography variant="body2" color="text.secondary" paragraph>
            Configure how you want to receive notifications from the platform
          </Typography>

          <Divider sx={{ mb: 3 }} />

          {message && (
            <Alert severity={message.type} sx={{ mb: 3 }}>
              {message.text}
            </Alert>
          )}

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
              gap: 3,
            }}
          >
            {/* Notification Methods */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Notification Methods
              </Typography>

              <Box sx={{ mb: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={preferences.emailNotifications}
                      onChange={handlePreferenceChange('emailNotifications')}
                      disabled={loading}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Email sx={{ mr: 1 }} />
                      Email Notifications
                      {getStatusChip(preferences.emailNotifications || false)}
                    </Box>
                  }
                />
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ ml: 4 }}
                >
                  Receive notifications via email at {user?.email}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={preferences.smsNotifications}
                      onChange={handlePreferenceChange('smsNotifications')}
                      disabled={loading}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Sms sx={{ mr: 1 }} />
                      SMS Notifications
                      {getStatusChip(preferences.smsNotifications || false)}
                    </Box>
                  }
                />
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ ml: 4 }}
                >
                  Receive notifications via SMS at {user?.phoneNumber}
                </Typography>
              </Box>
            </Box>

            {/* Notification Types */}
            <Box>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Notification Types
              </Typography>

              <Box sx={{ mb: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={preferences.meetingReminders}
                      onChange={handlePreferenceChange('meetingReminders')}
                      disabled={loading}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Event sx={{ mr: 1 }} />
                      Meeting Reminders
                      {getStatusChip(preferences.meetingReminders || false)}
                    </Box>
                  }
                />
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ ml: 4 }}
                >
                  Get notified about upcoming client meetings
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={preferences.auditReminders}
                      onChange={handlePreferenceChange('auditReminders')}
                      disabled={loading}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Assignment sx={{ mr: 1 }} />
                      Audit Reminders
                      {getStatusChip(preferences.auditReminders || false)}
                    </Box>
                  }
                />
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ ml: 4 }}
                >
                  Get notified about scheduled client audits
                </Typography>
              </Box>
            </Box>

            {/* Test Results */}
            {testResults && (
              <Box>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Test Results:
                  </Typography>
                  {testResults.email !== undefined && (
                    <Typography variant="body2">
                      Email: {getTestResultIcon(testResults.email)}{' '}
                      {testResults.email
                        ? 'Sent successfully'
                        : 'Failed to send'}
                    </Typography>
                  )}
                  {testResults.sms !== undefined && (
                    <Typography variant="body2">
                      SMS: {getTestResultIcon(testResults.sms)}{' '}
                      {testResults.sms ? 'Sent successfully' : 'Failed to send'}
                    </Typography>
                  )}
                </Alert>
              </Box>
            )}

            {/* Action Buttons */}
            <Box>
              <Box
                sx={{
                  display: 'flex',
                  gap: 2,
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                }}
              >
                <Button
                  variant="outlined"
                  startIcon={<Science />}
                  onClick={() => setTestDialogOpen(true)}
                  disabled={
                    loading ||
                    (!preferences.emailNotifications &&
                      !preferences.smsNotifications)
                  }
                >
                  Test Notifications
                </Button>

                <Button
                  variant="contained"
                  onClick={handleSavePreferences}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                  {loading ? 'Saving...' : 'Save Preferences'}
                </Button>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Test Notification Dialog */}
      <Dialog
        open={testDialogOpen}
        onClose={() => setTestDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Test Notifications</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" paragraph>
            Send a test notification to verify your settings are working
            correctly.
          </Typography>

          <FormControl component="fieldset" sx={{ mt: 2 }}>
            <FormLabel component="legend">Test Type</FormLabel>
            <RadioGroup
              value={testType}
              onChange={(e) =>
                setTestType(e.target.value as 'email' | 'sms' | 'both')
              }
            >
              <FormControlLabel
                value="email"
                control={<Radio />}
                label="Email only"
                disabled={!preferences.emailNotifications}
              />
              <FormControlLabel
                value="sms"
                control={<Radio />}
                label="SMS only"
                disabled={!preferences.smsNotifications}
              />
              <FormControlLabel
                value="both"
                control={<Radio />}
                label="Both email and SMS"
                disabled={
                  !preferences.emailNotifications ||
                  !preferences.smsNotifications
                }
              />
            </RadioGroup>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setTestDialogOpen(false)}
            disabled={testLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleTestNotification}
            variant="contained"
            disabled={testLoading}
            startIcon={
              testLoading ? <CircularProgress size={20} /> : <Science />
            }
          >
            {testLoading ? 'Sending...' : 'Send Test'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
