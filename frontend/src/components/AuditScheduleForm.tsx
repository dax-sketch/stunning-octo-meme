import React, { useState, useEffect } from 'react';
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
  Autocomplete,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { CreateAuditData } from '../types/audit';
import { auditService } from '../services/auditService';
import { companyService } from '../services/companyService';
import { UserService } from '../services/userService';

interface Company {
  id: string;
  name: string;
}

interface User {
  id: string;
  username: string;
  email: string;
}

interface AuditScheduleFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: Partial<CreateAuditData>;
}

export const AuditScheduleForm: React.FC<AuditScheduleFormProps> = ({
  open,
  onClose,
  onSuccess,
  initialData,
}) => {
  const [formData, setFormData] = useState<CreateAuditData>({
    companyId: '',
    scheduledDate: '',
    assignedTo: '',
    notes: '',
  });
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (open) {
      loadInitialData();
    }
  }, [open]);

  useEffect(() => {
    if (initialData) {
      setFormData((prev) => ({
        ...prev,
        ...initialData,
      }));
    }
  }, [initialData]);

  const loadInitialData = async () => {
    setLoadingData(true);
    try {
      console.log('🔍 Loading companies and users for audit form...');

      const [companiesResponse, usersResponse] = await Promise.all([
        companyService.getCompanies(),
        UserService.getUsers(),
      ]);

      console.log('📊 Companies response:', companiesResponse);
      console.log('👥 Users response:', usersResponse);

      if (companiesResponse.success && Array.isArray(companiesResponse.data)) {
        const companyList = companiesResponse.data.map((company) => ({
          id: company.id,
          name: company.name,
        }));
        console.log('✅ Loaded companies:', companyList);
        setCompanies(companyList);
      } else {
        console.log('❌ Failed to load companies:', companiesResponse.error);
      }

      if (usersResponse.success && Array.isArray(usersResponse.data)) {
        const userList = usersResponse.data.map((user) => ({
          id: user.id,
          username: user.username,
          email: user.email,
        }));
        console.log('✅ Loaded users:', userList);
        setUsers(userList);
      } else {
        console.log('❌ Failed to load users:', usersResponse.error);
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
      setError('Failed to load companies and users');
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await auditService.createAudit(formData);

      if (response.success) {
        onSuccess();
        handleClose();
      } else {
        setError(response.error?.message || 'Failed to schedule audit');
      }
    } catch (error) {
      setError('Failed to schedule audit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      companyId: '',
      scheduledDate: '',
      assignedTo: '',
      notes: '',
    });
    setError(null);
    onClose();
  };

  const handleDateChange = (date: Date | null) => {
    if (date) {
      setFormData((prev) => ({
        ...prev,
        scheduledDate: date.toISOString(),
      }));
    }
  };

  const isFormValid = () => {
    return formData.companyId && formData.scheduledDate && formData.assignedTo;
  };

  if (loadingData) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogContent>
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            py={4}
          >
            <CircularProgress />
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>Schedule New Audit</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 1 }}>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <Autocomplete
                options={companies}
                getOptionLabel={(option) => option.name}
                value={
                  companies.find((c) => c.id === formData.companyId) || null
                }
                onChange={(_, value) => {
                  setFormData((prev) => ({
                    ...prev,
                    companyId: value?.id || '',
                  }));
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Company"
                    required
                    fullWidth
                    margin="normal"
                  />
                )}
              />

              <DateTimePicker
                label="Scheduled Date & Time"
                value={
                  formData.scheduledDate
                    ? new Date(formData.scheduledDate)
                    : null
                }
                onChange={handleDateChange}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    margin: 'normal',
                    required: true,
                  },
                }}
                minDateTime={new Date()}
              />

              <Autocomplete
                options={users}
                getOptionLabel={(option) =>
                  `${option.username} (${option.email})`
                }
                value={users.find((u) => u.id === formData.assignedTo) || null}
                onChange={(_, value) => {
                  setFormData((prev) => ({
                    ...prev,
                    assignedTo: value?.id || '',
                  }));
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Assigned To"
                    required
                    fullWidth
                    margin="normal"
                  />
                )}
              />

              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={formData.notes}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }));
                }}
                margin="normal"
                placeholder="Optional notes about this audit..."
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading || !isFormValid()}
            >
              {loading ? <CircularProgress size={20} /> : 'Schedule Audit'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </LocalizationProvider>
  );
};
