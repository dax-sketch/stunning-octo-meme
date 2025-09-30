import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControlLabel,
  Switch,
  Typography,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  notificationService,
  NotificationPreferences as NotificationPreferencesType,
} from '../services/notificationService';

interface NotificationPreferencesProps {
  open: boolean;
  onClose: () => void;
}

export const NotificationPreferences: React.FC<
  NotificationPreferencesProps
> = ({ open, onClose }) => {
  const [preferences, setPreferences] = useState<NotificationPreferencesType>({
    emailNotifications: true,
    smsNotifications: false,
    meetingReminders: true,
    auditReminders: true,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (open) {
      loadPreferences();
    }
  }, [open]);

  const loadPreferences = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await notificationService.getNotificationPreferences();
      if (response.success && response.data) {
        setPreferences(response.data);
      } else {
        setError(response.error?.message || 'Failed to load preferences');
      }
    } catch (err) {
      setError('Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const handlePreferenceChange = (key: keyof NotificationPreferencesType) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    setSuccess(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response =
        await notificationService.updateNotificationPreferences(preferences);
      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(response.error?.message || 'Failed to save preferences');
      }
    } catch (err) {
      setError('Failed to save notification preferences');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Notification Preferences</DialogTitle>
      <DialogContent>
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : (
          <Box>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Preferences saved successfully!
              </Alert>
            )}

            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Delivery Methods
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={preferences.emailNotifications}
                  onChange={() => handlePreferenceChange('emailNotifications')}
                />
              }
              label="Email Notifications"
            />

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ ml: 4, mb: 2 }}
            >
              Receive notifications via email
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={preferences.smsNotifications}
                  onChange={() => handlePreferenceChange('smsNotifications')}
                />
              }
              label="SMS Notifications"
            />

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ ml: 4, mb: 3 }}
            >
              Receive notifications via text message
            </Typography>

            <Typography variant="h6" gutterBottom>
              Notification Types
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={preferences.meetingReminders}
                  onChange={() => handlePreferenceChange('meetingReminders')}
                />
              }
              label="Meeting Reminders"
            />

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ ml: 4, mb: 2 }}
            >
              Get reminded about upcoming meetings
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={preferences.auditReminders}
                  onChange={() => handlePreferenceChange('auditReminders')}
                />
              }
              label="Audit Reminders"
            />

            <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
              Get reminded about upcoming and overdue audits
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={loading || saving}
        >
          {saving ? <CircularProgress size={20} /> : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
