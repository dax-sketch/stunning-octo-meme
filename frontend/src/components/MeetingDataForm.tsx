import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Alert,
  CircularProgress,
  Chip,
  Typography,
} from '@mui/material';
import { Company } from '../types/company';
import { companyService } from '../services/companyService';

interface MeetingDataFormProps {
  open: boolean;
  onClose: () => void;
  company: Company;
  onSuccess: (updatedCompany: Company) => void;
}

export const MeetingDataForm: React.FC<MeetingDataFormProps> = ({
  open,
  onClose,
  company,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    lastMeetingDate: company.lastMeetingDate
      ? company.lastMeetingDate.split('T')[0]
      : '',
    lastMeetingDuration: company.lastMeetingDuration || 0,
    attendeeInput: '',
  });
  const [attendees, setAttendees] = useState<string[]>(
    company.lastMeetingAttendees || []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setError('');
  };

  const handleAddAttendee = () => {
    const attendee = formData.attendeeInput.trim();
    if (attendee && !attendees.includes(attendee)) {
      setAttendees((prev) => [...prev, attendee]);
      setFormData((prev) => ({ ...prev, attendeeInput: '' }));
    }
  };

  const handleRemoveAttendee = (attendeeToRemove: string) => {
    setAttendees((prev) =>
      prev.filter((attendee) => attendee !== attendeeToRemove)
    );
  };

  const handleAttendeeKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddAttendee();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.lastMeetingDate) {
      setError('Please select a meeting date');
      return;
    }

    if (formData.lastMeetingDuration && formData.lastMeetingDuration <= 0) {
      setError('Meeting duration must be greater than 0 minutes');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const meetingData: any = {
        lastMeetingDate: formData.lastMeetingDate,
      };

      if (attendees.length > 0) {
        meetingData.lastMeetingAttendees = attendees;
      }

      if (formData.lastMeetingDuration > 0) {
        meetingData.lastMeetingDuration = formData.lastMeetingDuration;
      }

      const response = await companyService.updateMeetingData(
        company.id,
        meetingData
      );

      if (response.success && response.data) {
        onSuccess(response.data as Company);
        onClose();
      } else {
        setError(response.error?.message || 'Failed to update meeting data');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError('');
      setFormData({
        lastMeetingDate: company.lastMeetingDate
          ? company.lastMeetingDate.split('T')[0]
          : '',
        lastMeetingDuration: company.lastMeetingDuration || 0,
        attendeeInput: '',
      });
      setAttendees(company.lastMeetingAttendees || []);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Update Meeting Data</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}

            <TextField
              label="Meeting Date"
              type="date"
              value={formData.lastMeetingDate}
              onChange={(e) =>
                handleInputChange('lastMeetingDate', e.target.value)
              }
              required
              fullWidth
              InputLabelProps={{
                shrink: true,
              }}
              disabled={loading}
            />

            <TextField
              label="Meeting Duration (minutes)"
              type="number"
              value={formData.lastMeetingDuration}
              onChange={(e) =>
                handleInputChange(
                  'lastMeetingDuration',
                  parseInt(e.target.value) || 0
                )
              }
              fullWidth
              inputProps={{
                min: 0,
                step: 1,
              }}
              disabled={loading}
              helperText="Optional - leave as 0 if not tracked"
            />

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Meeting Attendees
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                  label="Add attendee"
                  value={formData.attendeeInput}
                  onChange={(e) =>
                    handleInputChange('attendeeInput', e.target.value)
                  }
                  onKeyPress={handleAttendeeKeyPress}
                  size="small"
                  fullWidth
                  disabled={loading}
                />
                <Button
                  onClick={handleAddAttendee}
                  variant="outlined"
                  disabled={loading || !formData.attendeeInput.trim()}
                >
                  Add
                </Button>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {attendees.map((attendee, index) => (
                  <Chip
                    key={index}
                    label={attendee}
                    onDelete={() => handleRemoveAttendee(attendee)}
                    disabled={loading}
                  />
                ))}
              </Box>
              {attendees.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  No attendees added yet
                </Typography>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Updating...' : 'Update Meeting Data'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
