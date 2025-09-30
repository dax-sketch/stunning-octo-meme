import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  Paper,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Event as EventIcon,
  AccessTime as TimeIcon,
  Group as GroupIcon,
  Notes as NotesIcon,
} from '@mui/icons-material';
// Temporarily disabled date picker for deployment
// import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
// import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
// import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Company } from '../types/company';
import { companyService } from '../services/companyService';
import { meetingService, CreateMeetingData } from '../services/meetingService';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

interface ScheduleMeetingFormProps {
  onBack: () => void;
  onSuccess: () => void;
}

interface MeetingFormData {
  companyId: string;
  scheduledDate: Date | null;
  duration: number; // in minutes
  attendees: string[];
  notes: string;
}

interface FormErrors {
  companyId?: string;
  scheduledDate?: string;
  duration?: string;
  attendees?: string;
  notes?: string;
}

const DURATION_OPTIONS = [
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' },
];

export const ScheduleMeetingForm: React.FC<ScheduleMeetingFormProps> = ({
  onBack,
  onSuccess,
}) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [formData, setFormData] = useState<MeetingFormData>({
    companyId: '',
    scheduledDate: null,
    duration: 60,
    attendees: [],
    notes: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [attendeeInput, setAttendeeInput] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('');

  useEffect(() => {
    loadCompanies();
    loadUsers();
  }, []);

  const loadCompanies = async () => {
    setLoadingCompanies(true);
    try {
      const response = await companyService.getCompanies();
      if (response.success && Array.isArray(response.data)) {
        setCompanies(response.data);
      } else {
        console.error('Failed to load companies:', response.error);
      }
    } catch (error) {
      console.error('Error loading companies:', error);
    } finally {
      setLoadingCompanies(false);
    }
  };

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      // TODO: Create user service to fetch users
      // For now, we'll create a simple API call
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/users`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          setUsers(data.data);
        }
      } else {
        console.error('Failed to load users');
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.companyId) {
      newErrors.companyId = 'Please select a company';
    }

    if (!formData.scheduledDate) {
      newErrors.scheduledDate = 'Please select a date and time';
    } else if (formData.scheduledDate <= new Date()) {
      newErrors.scheduledDate = 'Meeting must be scheduled for a future date';
    }

    if (!formData.duration || formData.duration <= 0) {
      newErrors.duration = 'Please select a duration';
    }

    if (formData.attendees.length === 0) {
      newErrors.attendees = 'Please add at least one attendee';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError('');

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const meetingData: CreateMeetingData = {
        companyId: formData.companyId,
        scheduledDate: formData.scheduledDate!,
        duration: formData.duration,
        attendees: formData.attendees,
        notes: formData.notes.trim() || undefined,
      };

      const response = await meetingService.createMeeting(meetingData);

      if (response.success) {
        console.log('✅ Meeting scheduled successfully:', response.data);
        onSuccess();
      } else {
        setSubmitError(response.error?.message || 'Failed to schedule meeting');
      }
    } catch (error) {
      setSubmitError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFieldChange = (
    field: keyof MeetingFormData,
    value: string | Date | null | number | string[]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleAddAttendee = () => {
    if (
      attendeeInput.trim() &&
      !formData.attendees.includes(attendeeInput.trim())
    ) {
      const newAttendees = [...formData.attendees, attendeeInput.trim()];
      handleFieldChange('attendees', newAttendees);
      setAttendeeInput('');
    }
  };

  const handleAddUserAttendee = () => {
    if (selectedUser) {
      const user = users.find((u) => u.id === selectedUser);
      if (user) {
        const attendeeString = `${user.username} (${user.email})`;
        if (!formData.attendees.includes(attendeeString)) {
          const newAttendees = [...formData.attendees, attendeeString];
          handleFieldChange('attendees', newAttendees);
          setSelectedUser('');
        }
      }
    }
  };

  const handleRemoveAttendee = (attendeeToRemove: string) => {
    const newAttendees = formData.attendees.filter(
      (attendee) => attendee !== attendeeToRemove
    );
    handleFieldChange('attendees', newAttendees);
  };

  const handleAttendeeKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleAddAttendee();
    }
  };

  const selectedCompany = companies.find((c) => c.id === formData.companyId);

  return (
    // <LocalizationProvider dateAdapter={AdapterDateFns}>
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={onBack}>
          Back to Dashboard
        </Button>
      </Box>

      <Paper elevation={2} sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <EventIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Schedule Meeting
          </Typography>
        </Box>

        {submitError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {submitError}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Company Selection */}
            <FormControl fullWidth error={!!errors.companyId}>
              <InputLabel>Company *</InputLabel>
              <Select
                value={formData.companyId}
                onChange={(e) => handleFieldChange('companyId', e.target.value)}
                label="Company *"
                disabled={loadingCompanies}
              >
                {loadingCompanies ? (
                  <MenuItem disabled>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    Loading companies...
                  </MenuItem>
                ) : (
                  companies.map((company) => (
                    <MenuItem key={company.id} value={company.id}>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        {company.name}
                        <Chip
                          label={company.tier.replace('TIER_', 'Tier ')}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </MenuItem>
                  ))
                )}
              </Select>
              {errors.companyId && (
                <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                  {errors.companyId}
                </Typography>
              )}
            </FormControl>

            {/* Date and Time + Duration Row */}
            <Box
              sx={{
                display: 'flex',
                gap: 2,
                flexDirection: { xs: 'column', md: 'row' },
              }}
            >
              <Box sx={{ flex: 1 }}>
                <TextField
                  fullWidth
                  label="Meeting Date & Time *"
                  type="datetime-local"
                  value={
                    formData.scheduledDate
                      ? formData.scheduledDate.toISOString().slice(0, 16)
                      : ''
                  }
                  onChange={(e) =>
                    handleFieldChange(
                      'scheduledDate',
                      e.target.value ? new Date(e.target.value) : null
                    )
                  }
                  error={!!errors.scheduledDate}
                  helperText={errors.scheduledDate}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Box>

              <Box sx={{ flex: 1 }}>
                <FormControl fullWidth error={!!errors.duration}>
                  <InputLabel>Duration *</InputLabel>
                  <Select
                    value={formData.duration}
                    onChange={(e) =>
                      handleFieldChange('duration', e.target.value)
                    }
                    label="Duration *"
                    startAdornment={
                      <TimeIcon sx={{ mr: 1, color: 'action.active' }} />
                    }
                  >
                    {DURATION_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.duration && (
                    <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                      {errors.duration}
                    </Typography>
                  )}
                </FormControl>
              </Box>
            </Box>

            {/* Attendees */}
            <Box>
              <Typography
                variant="subtitle1"
                sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <GroupIcon />
                Attendees *
              </Typography>

              {/* Select from existing users */}
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <FormControl sx={{ flex: 1 }}>
                  <InputLabel>Select User</InputLabel>
                  <Select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    label="Select User"
                    disabled={loadingUsers}
                  >
                    {loadingUsers ? (
                      <MenuItem disabled>
                        <CircularProgress size={20} sx={{ mr: 1 }} />
                        Loading users...
                      </MenuItem>
                    ) : (
                      users.map((user) => (
                        <MenuItem key={user.id} value={user.id}>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                            }}
                          >
                            {user.username}
                            <Chip
                              label={user.role}
                              size="small"
                              variant="outlined"
                            />
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              ({user.email})
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
                <Button
                  variant="outlined"
                  onClick={handleAddUserAttendee}
                  disabled={!selectedUser}
                >
                  Add User
                </Button>
              </Box>

              {/* Manual attendee input */}
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  fullWidth
                  placeholder="Or enter attendee name/email manually"
                  value={attendeeInput}
                  onChange={(e) => setAttendeeInput(e.target.value)}
                  onKeyPress={handleAttendeeKeyPress}
                  error={!!errors.attendees}
                />
                <Button
                  variant="outlined"
                  onClick={handleAddAttendee}
                  disabled={!attendeeInput.trim()}
                >
                  Add
                </Button>
              </Box>

              {formData.attendees.length > 0 && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                  {formData.attendees.map((attendee, index) => (
                    <Chip
                      key={index}
                      label={attendee}
                      onDelete={() => handleRemoveAttendee(attendee)}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>
              )}

              {errors.attendees && (
                <Typography variant="caption" color="error">
                  {errors.attendees}
                </Typography>
              )}
            </Box>

            {/* Notes */}
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Meeting Notes"
              placeholder="Please include contact number and google meet link"
              value={formData.notes}
              onChange={(e) => handleFieldChange('notes', e.target.value)}
              InputProps={{
                startAdornment: (
                  <NotesIcon
                    sx={{
                      mr: 1,
                      color: 'action.active',
                      alignSelf: 'flex-start',
                      mt: 1,
                    }}
                  />
                ),
              }}
              error={!!errors.notes}
              helperText={errors.notes}
            />

            {/* Selected Company Info */}
            {selectedCompany && (
              <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
                <Typography variant="subtitle2" gutterBottom>
                  Meeting Details Summary:
                </Typography>
                <Typography variant="body2">
                  <strong>Company:</strong> {selectedCompany.name} (
                  {selectedCompany.tier.replace('TIER_', 'Tier ')})
                </Typography>
                <Typography variant="body2">
                  <strong>Contact:</strong> {selectedCompany.email} |{' '}
                  {selectedCompany.phoneNumber}
                </Typography>
                {formData.scheduledDate && (
                  <Typography variant="body2">
                    <strong>Scheduled:</strong>{' '}
                    {formData.scheduledDate.toLocaleString()}
                  </Typography>
                )}
                {formData.duration && (
                  <Typography variant="body2">
                    <strong>Duration:</strong>{' '}
                    {
                      DURATION_OPTIONS.find(
                        (d) => d.value === formData.duration
                      )?.label
                    }
                  </Typography>
                )}
              </Paper>
            )}
          </Box>

          {/* Submit Buttons */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 2,
              mt: 4,
            }}
          >
            <Button variant="outlined" onClick={onBack} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting}
              startIcon={
                isSubmitting ? <CircularProgress size={20} /> : <EventIcon />
              }
            >
              {isSubmitting ? 'Scheduling...' : 'Schedule Meeting'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
    // </LocalizationProvider>
  );
};
