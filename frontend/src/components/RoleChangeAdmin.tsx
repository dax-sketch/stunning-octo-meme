import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as DenyIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

import {
  RoleService,
  RoleChangeRequestWithUser,
  RoleChangeStatistics,
} from '../services/roleService';
import { useAuth } from '../hooks/useAuth';

interface ProcessDialogState {
  open: boolean;
  request: RoleChangeRequestWithUser | null;
  action: 'approve' | 'deny' | null;
}

export const RoleChangeAdmin: React.FC = () => {
  const [requests, setRequests] = useState<RoleChangeRequestWithUser[]>([]);
  const [statistics, setStatistics] = useState<RoleChangeStatistics | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processDialog, setProcessDialog] = useState<ProcessDialogState>({
    open: false,
    request: null,
    action: null,
  });
  const [adminNotes, setAdminNotes] = useState('');

  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [requestsResult, statsResult] = await Promise.all([
        RoleService.getPendingRequests(),
        RoleService.getRoleChangeStatistics(),
      ]);

      if ('success' in requestsResult && requestsResult.success) {
        setRequests(requestsResult.data || []);
      } else {
        setError('Failed to load role change requests');
      }

      if ('success' in statsResult && statsResult.success) {
        setStatistics(statsResult.data || null);
      }
    } catch (err) {
      setError('Failed to load role change data');
      console.error('Role change admin loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessRequest = async (action: 'approve' | 'deny') => {
    if (!processDialog.request) return;

    setProcessing(processDialog.request.id);
    setError(null);

    try {
      const result = await RoleService.processRoleRequest(
        processDialog.request.id,
        {
          action,
          adminNotes: adminNotes.trim() || undefined,
        }
      );

      if ('success' in result && result.success) {
        // Remove the processed request from the list
        setRequests((prev) =>
          prev.filter((req) => req.id !== processDialog.request!.id)
        );

        // Update statistics
        if (statistics) {
          setStatistics((prev) =>
            prev
              ? {
                  ...prev,
                  pending: prev.pending - 1,
                  [action === 'approve' ? 'approved' : 'denied']:
                    prev[action === 'approve' ? 'approved' : 'denied'] + 1,
                }
              : null
          );
        }

        setProcessDialog({ open: false, request: null, action: null });
        setAdminNotes('');
      } else {
        setError(`Failed to ${action} role change request`);
      }
    } catch (err) {
      setError(`Failed to ${action} role change request`);
      console.error(`Role change ${action} error:`, err);
    } finally {
      setProcessing(null);
    }
  };

  const openProcessDialog = (
    request: RoleChangeRequestWithUser,
    action: 'approve' | 'deny'
  ) => {
    setProcessDialog({ open: true, request, action });
    setAdminNotes('');
  };

  const closeProcessDialog = () => {
    setProcessDialog({ open: false, request: null, action: null });
    setAdminNotes('');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Check if user can approve role changes
  if (!user || !RoleService.canApproveRoleChanges(user.role)) {
    return (
      <Alert severity="error">
        You do not have permission to access role change administration.
      </Alert>
    );
  }

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h5" component="h2">
          Role Change Administration
        </Typography>
        <Tooltip title="Refresh data">
          <IconButton onClick={loadData} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      {statistics && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(2, 1fr)',
              sm: 'repeat(4, 1fr)',
            },
            gap: 2,
            mb: 3,
          }}
        >
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="primary">
                {statistics.total}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Requests
              </Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="warning.main">
                {statistics.pending}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pending
              </Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="success.main">
                {statistics.approved}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Approved
              </Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="error.main">
                {statistics.denied}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Denied
              </Typography>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Pending Requests Table */}
      <Paper>
        <Box p={2}>
          <Typography variant="h6" gutterBottom>
            Pending Role Change Requests ({requests.length})
          </Typography>
        </Box>

        {requests.length === 0 ? (
          <Box p={4} textAlign="center">
            <Typography color="text.secondary">
              No pending role change requests
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  {!isMobile && <TableCell>Current Role</TableCell>}
                  <TableCell>Requested Role</TableCell>
                  {!isMobile && <TableCell>Submitted</TableCell>}
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {request.user?.username || 'Unknown User'}
                        </Typography>
                        {!isMobile && (
                          <Typography variant="caption" color="text.secondary">
                            {request.user?.email}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    {!isMobile && (
                      <TableCell>
                        <Chip
                          label={RoleService.getRoleDisplayName(
                            request.currentRole
                          )}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                    )}
                    <TableCell>
                      <Chip
                        label={RoleService.getRoleDisplayName(
                          request.requestedRole
                        )}
                        size="small"
                        color="primary"
                      />
                    </TableCell>
                    {!isMobile && (
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(request.submittedAt)}
                        </Typography>
                      </TableCell>
                    )}
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() =>
                              openProcessDialog(request, 'approve')
                            }
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Approve">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() =>
                              openProcessDialog(request, 'approve')
                            }
                            disabled={processing === request.id}
                          >
                            <ApproveIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Deny">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => openProcessDialog(request, 'deny')}
                            disabled={processing === request.id}
                          >
                            <DenyIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Process Request Dialog */}
      <Dialog
        open={processDialog.open}
        onClose={closeProcessDialog}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>
          {processDialog.action === 'approve' ? 'Approve' : 'Deny'} Role Change
          Request
        </DialogTitle>
        <DialogContent>
          {processDialog.request && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Request Details
              </Typography>
              <Box mb={2}>
                <Typography variant="body2">
                  <strong>User:</strong> {processDialog.request.user?.username}{' '}
                  ({processDialog.request.user?.email})
                </Typography>
                <Typography variant="body2">
                  <strong>Current Role:</strong>{' '}
                  {RoleService.getRoleDisplayName(
                    processDialog.request.currentRole
                  )}
                </Typography>
                <Typography variant="body2">
                  <strong>Requested Role:</strong>{' '}
                  {RoleService.getRoleDisplayName(
                    processDialog.request.requestedRole
                  )}
                </Typography>
                <Typography variant="body2">
                  <strong>Submitted:</strong>{' '}
                  {formatDate(processDialog.request.submittedAt)}
                </Typography>
              </Box>

              <Typography variant="subtitle2" gutterBottom>
                Justification
              </Typography>
              <Paper
                variant="outlined"
                sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}
              >
                <Typography variant="body2">
                  {processDialog.request.justification}
                </Typography>
              </Paper>

              <TextField
                fullWidth
                multiline
                rows={3}
                label={`Admin Notes ${processDialog.action === 'deny' ? '(Required for denial)' : '(Optional)'}`}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder={
                  processDialog.action === 'approve'
                    ? 'Optional notes about the approval...'
                    : 'Please provide a reason for denial...'
                }
                error={processDialog.action === 'deny' && !adminNotes.trim()}
                helperText={
                  processDialog.action === 'deny' && !adminNotes.trim()
                    ? 'Admin notes are required when denying a request'
                    : undefined
                }
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeProcessDialog}>Cancel</Button>
          <Button
            onClick={() => handleProcessRequest(processDialog.action!)}
            variant="contained"
            color={processDialog.action === 'approve' ? 'success' : 'error'}
            disabled={
              processing === processDialog.request?.id ||
              (processDialog.action === 'deny' && !adminNotes.trim())
            }
            startIcon={
              processing === processDialog.request?.id ? (
                <CircularProgress size={16} />
              ) : processDialog.action === 'approve' ? (
                <ApproveIcon />
              ) : (
                <DenyIcon />
              )
            }
          >
            {processDialog.action === 'approve' ? 'Approve' : 'Deny'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
