import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  FormControl,
  InputLabel,
  Select,
  ToggleButton,
  ToggleButtonGroup,
  Alert,
  CircularProgress,
  Snackbar,
} from '@mui/material';

import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  CalendarToday as CalendarIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  ViewList as ViewListIcon,
  CalendarMonth as CalendarMonthIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Audit, AuditFilters } from '../types/audit';
import { auditService } from '../services/auditService';
import { AuditScheduleForm } from '../components/AuditScheduleForm';
import { AuditCalendarView } from '../components/AuditCalendarView';

export const AuditsPage: React.FC = () => {
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [scheduleFormOpen, setScheduleFormOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Filters
  const [filters, setFilters] = useState<AuditFilters>({
    status: undefined,
    search: '',
    scheduledDateFrom: undefined,
    scheduledDateTo: undefined,
  });

  // UI state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedAudit, setSelectedAudit] = useState<Audit | null>(null);

  useEffect(() => {
    loadAudits();
  }, [filters]);

  const loadAudits = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await auditService.getAudits(filters);

      if (response.success && Array.isArray(response.data)) {
        setAudits(response.data);
      } else {
        const errorMessage = response.error?.message || 'Failed to load audits';
        const errorCode = response.error?.code || 'UNKNOWN_ERROR';
        setError(`${errorMessage} (${errorCode})`);

        // Log additional debug info for authentication errors
        if (
          errorCode === 'AUTHENTICATION_FAILED' ||
          errorCode.includes('TOKEN')
        ) {
          console.error('Authentication error details:', response.error);
          const token = localStorage.getItem('token');
          if (token && (window as any).tokenDebug) {
            (window as any).tokenDebug.logTokenInfo(token);
          }
        }
      }
    } catch (error: any) {
      console.error('Audit loading error:', error);
      setError(
        `Failed to load audits. Please try again. (${error.message || 'Unknown error'})`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleMenuClick = (
    event: React.MouseEvent<HTMLElement>,
    audit: Audit
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedAudit(audit);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedAudit(null);
  };

  const handleViewModeChange = (
    _: React.MouseEvent<HTMLElement>,
    newViewMode: 'list' | 'calendar' | null
  ) => {
    if (newViewMode !== null) {
      setViewMode(newViewMode);
    }
  };

  const handleFilterChange = (key: keyof AuditFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleAuditAction = async (action: string, audit: Audit) => {
    try {
      let response;

      switch (action) {
        case 'complete':
          response = await auditService.completeAudit(audit.id);
          break;
        case 'delete':
          response = await auditService.deleteAudit(audit.id);
          break;
        default:
          return;
      }

      if (response.success) {
        setSnackbar({
          open: true,
          message: `Audit ${action}d successfully`,
          severity: 'success',
        });
        loadAudits(); // Reload audits
      } else {
        setSnackbar({
          open: true,
          message: response.error?.message || `Failed to ${action} audit`,
          severity: 'error',
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Failed to ${action} audit`,
        severity: 'error',
      });
    }

    handleMenuClose();
  };

  const handleScheduleSuccess = () => {
    setSnackbar({
      open: true,
      message: 'Audit scheduled successfully',
      severity: 'success',
    });
    loadAudits();
  };

  const handleAuditClick = (audit: Audit) => {
    // TODO: Open audit details modal or navigate to audit details page
    console.log('Audit clicked:', audit);
  };

  const handleDateClick = (date: Date) => {
    // Open schedule form with pre-selected date
    setScheduleFormOpen(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon color="success" />;
      case 'in_progress':
        return <ScheduleIcon color="primary" />;
      case 'overdue':
        return <WarningIcon color="error" />;
      default:
        return <CalendarIcon color="action" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'primary';
      case 'overdue':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={3}
          >
            <Box>
              <Typography variant="h4" component="h1" gutterBottom>
                Audits
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Schedule and manage company audits
              </Typography>
            </Box>
            <Box display="flex" gap={2} alignItems="center">
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={handleViewModeChange}
                size="small"
              >
                <ToggleButton value="list">
                  <ViewListIcon />
                </ToggleButton>
                <ToggleButton value="calendar">
                  <CalendarMonthIcon />
                </ToggleButton>
              </ToggleButtonGroup>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setScheduleFormOpen(true)}
              >
                Schedule Audit
              </Button>
            </Box>
          </Box>

          {/* Filters */}
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 2,
              mb: 3,
            }}
          >
            <Box sx={{ flex: '1 1 300px', minWidth: '200px' }}>
              <TextField
                fullWidth
                label="Search audits"
                variant="outlined"
                value={filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Search by company, type, or assignee..."
              />
            </Box>
            <Box sx={{ flex: '1 1 150px', minWidth: '120px' }}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status || 'all'}
                  label="Status"
                  onChange={(e) =>
                    handleFilterChange(
                      'status',
                      e.target.value === 'all' ? undefined : e.target.value
                    )
                  }
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value="scheduled">Scheduled</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="overdue">Overdue</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ flex: '1 1 180px', minWidth: '150px' }}>
              <DatePicker
                label="From Date"
                value={
                  filters.scheduledDateFrom
                    ? new Date(filters.scheduledDateFrom)
                    : null
                }
                onChange={(date) =>
                  handleFilterChange('scheduledDateFrom', date?.toISOString())
                }
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: 'medium',
                  },
                }}
              />
            </Box>
            <Box sx={{ flex: '1 1 180px', minWidth: '150px' }}>
              <DatePicker
                label="To Date"
                value={
                  filters.scheduledDateTo
                    ? new Date(filters.scheduledDateTo)
                    : null
                }
                onChange={(date) =>
                  handleFilterChange('scheduledDateTo', date?.toISOString())
                }
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: 'medium',
                  },
                }}
              />
            </Box>
          </Box>

          {/* Error Display */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Loading State */}
          {loading && (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          )}

          {/* Content */}
          {!loading && !error && (
            <>
              {viewMode === 'calendar' ? (
                <AuditCalendarView
                  audits={audits}
                  onAuditClick={handleAuditClick}
                  onDateClick={handleDateClick}
                />
              ) : (
                <>
                  {/* Audits List */}
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: {
                        xs: '1fr',
                        md: 'repeat(2, 1fr)',
                        lg: 'repeat(3, 1fr)',
                      },
                      gap: 2,
                    }}
                  >
                    {audits.map((audit) => (
                      <Card key={audit.id}>
                        <CardContent>
                          <Box
                            display="flex"
                            justifyContent="space-between"
                            alignItems="flex-start"
                            mb={2}
                          >
                            <Box display="flex" alignItems="center" gap={1}>
                              {getStatusIcon(audit.status)}
                              <Typography variant="h6" component="h3">
                                {audit.companyName}
                              </Typography>
                            </Box>
                            <IconButton
                              size="small"
                              onClick={(e) => handleMenuClick(e, audit)}
                            >
                              <MoreVertIcon />
                            </IconButton>
                          </Box>

                          <Box mb={2}>
                            <Chip
                              label={audit.status
                                .replace('_', ' ')
                                .toUpperCase()}
                              color={getStatusColor(audit.status) as any}
                              size="small"
                              sx={{ mb: 1 }}
                            />

                            <Typography variant="body2" color="text.secondary">
                              Assigned to: {audit.assignedTo}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Scheduled:{' '}
                              {new Date(
                                audit.scheduledDate
                              ).toLocaleDateString()}
                            </Typography>
                            {audit.completedDate && (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                Completed:{' '}
                                {new Date(
                                  audit.completedDate
                                ).toLocaleDateString()}
                              </Typography>
                            )}
                          </Box>

                          {audit.notes && (
                            <Typography
                              variant="body2"
                              sx={{ fontStyle: 'italic' }}
                            >
                              {audit.notes}
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </Box>

                  {audits.length === 0 && (
                    <Box textAlign="center" py={4}>
                      <Typography variant="h6" color="text.secondary">
                        No audits found
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {filters.status || filters.search
                          ? 'Try adjusting your filters'
                          : 'Schedule your first audit to get started'}
                      </Typography>
                    </Box>
                  )}
                </>
              )}
            </>
          )}
        </Paper>

        {/* Context Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => handleAuditClick(selectedAudit!)}>
            View Details
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>Edit</MenuItem>
          {selectedAudit?.status === 'scheduled' && (
            <MenuItem
              onClick={() => handleAuditAction('start', selectedAudit!)}
            >
              Start Audit
            </MenuItem>
          )}
          {selectedAudit?.status === 'in_progress' && (
            <MenuItem
              onClick={() => handleAuditAction('complete', selectedAudit!)}
            >
              Complete Audit
            </MenuItem>
          )}
          <MenuItem
            onClick={() => handleAuditAction('delete', selectedAudit!)}
            sx={{ color: 'error.main' }}
          >
            Delete
          </MenuItem>
        </Menu>

        {/* Schedule Form Dialog */}
        <AuditScheduleForm
          open={scheduleFormOpen}
          onClose={() => setScheduleFormOpen(false)}
          onSuccess={handleScheduleSuccess}
        />

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        >
          <Alert
            onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </LocalizationProvider>
  );
};
