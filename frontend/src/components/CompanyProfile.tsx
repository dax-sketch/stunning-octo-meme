import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Button,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Language as WebsiteIcon,
  AttachMoney as MoneyIcon,
  Payment as PaymentIcon,
  Group as MeetingIcon,
} from '@mui/icons-material';
import { Company, TIER_LABELS, TIER_COLORS } from '../types/company';
import { companyService } from '../services/companyService';
import { CompanyNotes } from './CompanyNotes';
import { paymentService, Payment } from '../services/paymentService';
import { meetingService, Meeting } from '../services/meetingService';

interface CompanyProfileProps {
  companyId: string;
  onBack: () => void;
  onEdit: (company: Company) => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`company-tabpanel-${index}`}
      aria-labelledby={`company-tab-${index}`}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

export const CompanyProfile: React.FC<CompanyProfileProps> = ({
  companyId,
  onBack,
  onEdit,
}) => {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState(0);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [completedMeetings, setCompletedMeetings] = useState<Meeting[]>([]);
  const [loadingMeetings, setLoadingMeetings] = useState(false);
  const [meetingNotesDialog, setMeetingNotesDialog] = useState<{
    open: boolean;
    meetingId: string;
    currentNotes: string;
  }>({
    open: false,
    meetingId: '',
    currentNotes: '',
  });
  const [newMeetingNotes, setNewMeetingNotes] = useState('');

  useEffect(() => {
    loadCompany();
  }, [companyId]);

  useEffect(() => {
    if (activeTab === 1 && company) {
      loadPayments();
    } else if (activeTab === 2 && company) {
      loadCompletedMeetings();
    }
  }, [activeTab, company]);

  const loadCompany = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await companyService.getCompany(companyId);
      if (response.success && response.data) {
        setCompany(response.data as Company);
      } else {
        setError(response.error?.message || 'Failed to load company details');
      }
    } catch (err) {
      setError('An unexpected error occurred while loading company details');
    } finally {
      setLoading(false);
    }
  };

  const loadPayments = async () => {
    if (!company) return;

    setLoadingPayments(true);
    try {
      const response = await paymentService.getPayments({
        companyId: company.id,
      });
      if (response.success && response.data) {
        const paymentsData = Array.isArray(response.data)
          ? response.data
          : [response.data];
        setPayments(paymentsData);
      } else {
        console.error('Failed to load payments:', response.error);
      }
    } catch (error) {
      console.error('Error loading payments:', error);
    } finally {
      setLoadingPayments(false);
    }
  };

  const loadCompletedMeetings = async () => {
    if (!company) return;

    setLoadingMeetings(true);
    try {
      const response = await meetingService.getMeetingHistory(company.id);
      if (response.success && response.data) {
        const meetingsData = Array.isArray(response.data)
          ? response.data
          : [response.data];
        setCompletedMeetings(meetingsData);
      } else {
        console.error('Failed to load completed meetings:', response.error);
      }
    } catch (error) {
      console.error('Error loading completed meetings:', error);
    } finally {
      setLoadingMeetings(false);
    }
  };

  const handleAddMeetingNotes = async () => {
    try {
      const response = await meetingService.addMeetingNotes(
        meetingNotesDialog.meetingId,
        newMeetingNotes
      );
      if (response.success) {
        loadCompletedMeetings();
        setMeetingNotesDialog({ open: false, meetingId: '', currentNotes: '' });
        setNewMeetingNotes('');
      } else {
        console.error('Failed to add meeting notes:', response.error);
      }
    } catch (error) {
      console.error('Error adding meeting notes:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getCompanyAge = () => {
    if (!company) return '';

    const startDate = new Date(company.startDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 30) {
      return `${diffDays} days old`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months > 1 ? 's' : ''} old`;
    } else {
      const years = Math.floor(diffDays / 365);
      const remainingMonths = Math.floor((diffDays % 365) / 30);
      return `${years} year${years > 1 ? 's' : ''} ${remainingMonths > 0 ? `and ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}` : ''} old`;
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 400,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Button startIcon={<ArrowBackIcon />} onClick={onBack} sx={{ mb: 2 }}>
          Back to Companies
        </Button>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!company) {
    return (
      <Box>
        <Button startIcon={<ArrowBackIcon />} onClick={onBack} sx={{ mb: 2 }}>
          Back to Companies
        </Button>
        <Alert severity="warning">Company not found</Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 3,
        }}
      >
        <Button startIcon={<ArrowBackIcon />} onClick={onBack}>
          Back to Companies
        </Button>
        <Button
          variant="contained"
          startIcon={<EditIcon />}
          onClick={() => onEdit(company)}
        >
          Edit Company
        </Button>
      </Box>

      {/* Company Header */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 2,
          }}
        >
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            {company.name}
          </Typography>
          <Chip
            label={TIER_LABELS[company.tier]}
            sx={{
              backgroundColor: TIER_COLORS[company.tier],
              color: 'white',
              fontWeight: 'bold',
              fontSize: '0.875rem',
            }}
          />
        </Box>

        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          {getCompanyAge()} • Started {formatDate(company.startDate)}
        </Typography>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
            gap: 3,
            mt: 2,
          }}
        >
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PhoneIcon color="action" />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Phone
                </Typography>
                <Typography variant="body1">{company.phoneNumber}</Typography>
              </Box>
            </Box>
          </Box>

          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <EmailIcon color="action" />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Email
                </Typography>
                <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>
                  {company.email}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <WebsiteIcon color="action" />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Website
                </Typography>
                <Typography
                  variant="body1"
                  component="a"
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    color: 'primary.main',
                    textDecoration: 'none',
                    wordBreak: 'break-word',
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  {company.website}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <MoneyIcon color="action" />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Weekly Ad Spend
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  {formatCurrency(company.adSpend)}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Tabs */}
      <Paper elevation={2}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="company profile tabs"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Overview" />
          <Tab label="Payment History" />
          <Tab label="Meeting History" />
          <Tab label="Notes" />
        </Tabs>

        <TabPanel value={activeTab} index={0}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
              gap: 3,
              pl: 2, // Move content away from left border
            }}
          >
            <Box>
              <Typography variant="h6" gutterBottom>
                Company Information
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Company Name
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {company.name}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Start Date
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(company.startDate)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Tier Classification
                  </Typography>
                  <Chip
                    label={TIER_LABELS[company.tier]}
                    size="small"
                    sx={{
                      backgroundColor: TIER_COLORS[company.tier],
                      color: 'white',
                      fontWeight: 'bold',
                    }}
                  />
                </Box>
              </Box>
            </Box>

            <Box>
              <Typography variant="h6" gutterBottom>
                Financial Information
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Weekly Ad Spend
                  </Typography>
                  <Typography
                    variant="h5"
                    color="primary"
                    sx={{ fontWeight: 'bold' }}
                  >
                    {formatCurrency(company.adSpend)}
                  </Typography>
                </Box>
                {company.lastPaymentDate && (
                  <>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Last Payment Date
                      </Typography>
                      <Typography variant="body1">
                        {formatDate(company.lastPaymentDate)}
                      </Typography>
                    </Box>
                    {company.lastPaymentAmount && (
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Last Payment Amount
                        </Typography>
                        <Typography variant="body1">
                          {formatCurrency(company.lastPaymentAmount)}
                        </Typography>
                      </Box>
                    )}
                  </>
                )}
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Created
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(company.createdAt)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Last Updated
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(company.updatedAt)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <Typography variant="h6" sx={{ mb: 2, pl: 2 }}>
            Payment History
          </Typography>
          {loadingPayments ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : payments.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {payments.map((payment) => (
                <Paper
                  key={payment.id}
                  sx={{ p: 3, border: 1, borderColor: 'divider' }}
                >
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
                      gap: 2,
                      mb: payment.notes ? 2 : 0,
                    }}
                  >
                    <Box>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          mb: 1,
                        }}
                      >
                        <PaymentIcon color="primary" />
                        <Typography variant="body2" color="text.secondary">
                          Payment Date
                        </Typography>
                      </Box>
                      <Typography variant="h6">
                        {formatDate(payment.paymentDate)}
                      </Typography>
                    </Box>

                    <Box>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          mb: 1,
                        }}
                      >
                        <MoneyIcon color="primary" />
                        <Typography variant="body2" color="text.secondary">
                          Amount
                        </Typography>
                      </Box>
                      <Typography variant="h6" color="success.main">
                        {formatCurrency(payment.amount)}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom
                      >
                        Recorded By
                      </Typography>
                      <Typography variant="body1">
                        {payment.createdByUsername || 'Unknown User'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(payment.createdAt)}
                      </Typography>
                    </Box>
                  </Box>

                  {payment.notes && (
                    <Box
                      sx={{
                        mt: 2,
                        p: 2,
                        backgroundColor: 'grey.50',
                        borderRadius: 1,
                      }}
                    >
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom
                      >
                        Notes
                      </Typography>
                      <Typography variant="body2">{payment.notes}</Typography>
                    </Box>
                  )}
                </Paper>
              ))}
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <PaymentIcon
                sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }}
              />
              <Typography variant="body1" color="text.secondary" gutterBottom>
                No payment history available
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Payment records will be displayed here when available.
              </Typography>
            </Box>
          )}
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <Typography variant="h6" sx={{ mb: 2, pl: 2 }}>
            Meeting History
          </Typography>
          {loadingMeetings ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : completedMeetings.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {completedMeetings.map((meeting: Meeting) => (
                <Paper
                  key={meeting.id}
                  sx={{ p: 3, border: 1, borderColor: 'divider' }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      mb: 2,
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" gutterBottom>
                        {formatDate(meeting.scheduledDate)}
                      </Typography>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          mb: 1,
                        }}
                      >
                        <Chip
                          label={meeting.status || 'scheduled'}
                          size="small"
                          color={
                            meeting.status === 'completed'
                              ? 'success'
                              : meeting.status === 'confirmed'
                                ? 'primary'
                                : 'default'
                          }
                        />
                        {meeting.duration && (
                          <Typography variant="body2" color="text.secondary">
                            Duration: {meeting.duration} minutes
                          </Typography>
                        )}
                      </Box>

                      {/* Attendees with RSVP Status */}
                      <Box sx={{ mt: 1 }}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          gutterBottom
                        >
                          Attendees:
                        </Typography>
                        <Box
                          sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}
                        >
                          {meeting.attendees.map(
                            (attendee: string, index: number) => {
                              // Find RSVP status for this attendee
                              const attendeeRSVP = meeting.rsvpDetails
                                ? (Object.values(meeting.rsvpDetails).find(
                                    (detail) =>
                                      detail.username === attendee ||
                                      detail.email === attendee
                                  ) as
                                    | {
                                        response: 'going' | 'not_going';
                                        username: string;
                                        email: string;
                                      }
                                    | undefined)
                                : null;

                              const status = attendeeRSVP
                                ? attendeeRSVP.response
                                : 'waiting';
                              const statusText =
                                status === 'going'
                                  ? 'going'
                                  : status === 'not_going'
                                    ? "can't go"
                                    : 'waiting...';
                              const statusColor =
                                status === 'going'
                                  ? '#e8f5e8'
                                  : status === 'not_going'
                                    ? '#ffebee'
                                    : '#f5f5f5';
                              const textColor =
                                status === 'going'
                                  ? '#2e7d32'
                                  : status === 'not_going'
                                    ? '#c62828'
                                    : '#666';

                              return (
                                <Box
                                  key={index}
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                  }}
                                >
                                  <Typography
                                    variant="body2"
                                    color="text.primary"
                                  >
                                    {attendee}
                                  </Typography>
                                  <Chip
                                    label={statusText}
                                    size="small"
                                    sx={{
                                      backgroundColor: statusColor,
                                      color: textColor,
                                      fontSize: '0.65rem',
                                      height: '18px',
                                    }}
                                  />
                                </Box>
                              );
                            }
                          )}
                        </Box>
                      </Box>

                      {/* RSVP Responses */}
                      {meeting.rsvpDetails &&
                        Object.keys(meeting.rsvpDetails).length > 0 && (
                          <Box sx={{ mt: 1 }}>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              gutterBottom
                            >
                              Responses:
                            </Typography>
                            <Box
                              sx={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: 0.5,
                              }}
                            >
                              {Object.entries(meeting.rsvpDetails).map(
                                ([userId, details]: [
                                  string,
                                  {
                                    response: 'going' | 'not_going';
                                    username: string;
                                    email: string;
                                  },
                                ]) => (
                                  <Chip
                                    key={userId}
                                    label={`${details.username} ${details.response === 'going' ? 'is going' : "can't go"}`}
                                    size="small"
                                    sx={{
                                      backgroundColor:
                                        details.response === 'going'
                                          ? '#e8f5e8'
                                          : '#ffebee',
                                      color:
                                        details.response === 'going'
                                          ? '#2e7d32'
                                          : '#c62828',
                                      fontSize: '0.75rem',
                                    }}
                                  />
                                )
                              )}
                            </Box>
                          </Box>
                        )}

                      {/* Meeting Notes */}
                      {meeting.notes && (
                        <Box
                          sx={{
                            mt: 2,
                            p: 2,
                            backgroundColor: 'grey.50',
                            borderRadius: 1,
                          }}
                        >
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            gutterBottom
                          >
                            Pre-meeting Notes:
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              wordBreak: 'break-word',
                              overflowWrap: 'break-word',
                              whiteSpace: 'pre-wrap',
                              maxWidth: '100%',
                            }}
                          >
                            {meeting.notes}
                          </Typography>
                        </Box>
                      )}

                      {/* Post-meeting Notes */}
                      {meeting.meetingNotes && (
                        <Box
                          sx={{
                            mt: 2,
                            p: 2,
                            backgroundColor: 'primary.50',
                            borderRadius: 1,
                          }}
                        >
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            gutterBottom
                          >
                            Meeting Notes:
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              wordBreak: 'break-word',
                              overflowWrap: 'break-word',
                              whiteSpace: 'pre-wrap',
                              maxWidth: '100%',
                            }}
                          >
                            {meeting.meetingNotes}
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    {/* Add/Edit Post Meeting Notes Button */}
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        setMeetingNotesDialog({
                          open: true,
                          meetingId: meeting.id,
                          currentNotes: meeting.meetingNotes || '',
                        });
                        setNewMeetingNotes(meeting.meetingNotes || '');
                      }}
                    >
                      {meeting.meetingNotes
                        ? 'Edit Post Meeting Notes'
                        : 'Add Post Meeting Notes'}
                    </Button>
                  </Box>
                </Paper>
              ))}
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <MeetingIcon
                sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }}
              />
              <Typography variant="body1" color="text.secondary" gutterBottom>
                No meetings scheduled yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Meetings will appear here once they are scheduled.
              </Typography>
            </Box>
          )}
        </TabPanel>

        <TabPanel value={activeTab} index={3}>
          <CompanyNotes companyId={companyId} companyName={company.name} />
        </TabPanel>
      </Paper>
      {/* Meeting Notes Dialog */}
      <Dialog
        open={meetingNotesDialog.open}
        onClose={() =>
          setMeetingNotesDialog({
            open: false,
            meetingId: '',
            currentNotes: '',
          })
        }
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Meeting Notes</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={newMeetingNotes}
            onChange={(e) => setNewMeetingNotes(e.target.value)}
            placeholder="Add notes about what was discussed in this meeting..."
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              setMeetingNotesDialog({
                open: false,
                meetingId: '',
                currentNotes: '',
              })
            }
          >
            Cancel
          </Button>
          <Button onClick={handleAddMeetingNotes} variant="contained">
            Save Notes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
