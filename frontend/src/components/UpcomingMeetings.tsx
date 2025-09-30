import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Collapse,
  Button,
  Chip,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CheckCircle as GoingIcon,
  Cancel as NotGoingIcon,
} from '@mui/icons-material';
import { meetingService, Meeting } from '../services/meetingService';
import { useAuth } from '../hooks/useAuth';

interface UpcomingMeeting {
  id: string;
  companyName: string;
  scheduledDate: string;
  attendees: string[];
  duration?: number;
  notes?: string;
  rsvpResponses?: { [userId: string]: 'going' | 'not_going' };
  rsvpDetails?: {
    [userId: string]: {
      response: 'going' | 'not_going';
      username: string;
      email: string;
    };
  };
  status?: string;
}

export const UpcomingMeetings: React.FC = () => {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<UpcomingMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedMeeting, setExpandedMeeting] = useState<string | null>(null);
  const [rsvpLoading, setRsvpLoading] = useState<string | null>(null);

  useEffect(() => {
    loadMeetings();
  }, []);

  const loadMeetings = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Loading upcoming meetings...');
      const response = await meetingService.getUpcomingMeetings(7); // Next 7 days for the meetings section

      if (response.success && response.data) {
        console.log('✅ Meetings loaded:', response.data);
        const meetingsData = Array.isArray(response.data)
          ? response.data
          : [response.data];

        // Transform to match the component's expected format
        const transformedMeetings: UpcomingMeeting[] = meetingsData.map(
          (meeting: Meeting) => ({
            id: meeting.id,
            companyName: meeting.companyName,
            scheduledDate: meeting.scheduledDate,
            attendees: meeting.attendees,
            duration: meeting.duration,
            notes: meeting.notes,
            rsvpResponses: meeting.rsvpResponses,
            rsvpDetails: meeting.rsvpDetails,
            status: meeting.status,
          })
        );

        setMeetings(transformedMeetings);
      } else {
        console.error('❌ Failed to load meetings:', response.error);
        setError(response.error?.message || 'Failed to load upcoming meetings');
      }
    } catch (error: any) {
      console.error('❌ Error loading meetings:', error);
      setError('Failed to load upcoming meetings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMeetingExpansion = (meetingId: string) => {
    setExpandedMeeting(expandedMeeting === meetingId ? null : meetingId);
  };

  const handleRSVP = async (
    meetingId: string,
    response: 'going' | 'not_going'
  ) => {
    console.log('🔍 RSVP clicked:', { meetingId, response });
    setRsvpLoading(meetingId);
    try {
      const result = await meetingService.updateRSVP(meetingId, response);
      console.log('📝 RSVP result:', result);

      if (result.success && result.data) {
        console.log('✅ RSVP successful, updating local state');
        // Update the meeting in the local state
        setMeetings((prev) =>
          prev.map((meeting) =>
            meeting.id === meetingId
              ? {
                  ...meeting,
                  rsvpResponses: (result.data as Meeting).rsvpResponses,
                  rsvpDetails: (result.data as Meeting).rsvpDetails,
                  status: (result.data as Meeting).status,
                }
              : meeting
          )
        );
      } else {
        console.error('❌ Failed to update RSVP:', result.error);
        setError(result.error?.message || 'Failed to update RSVP');
      }
    } catch (error) {
      console.error('❌ Error updating RSVP:', error);
      setError('An error occurred while updating RSVP');
    } finally {
      setRsvpLoading(null);
    }
  };

  const getCurrentUserRSVP = (
    meeting: UpcomingMeeting
  ): 'going' | 'not_going' | null => {
    if (!user?.id || !meeting.rsvpResponses) return null;
    return meeting.rsvpResponses[user.id] || null;
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="center" py={2}>
            <CircularProgress size={24} />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box sx={{ width: '100%', minWidth: 0 }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <Typography variant="h6" sx={{ fontWeight: 400 }}>
          Upcoming Meetings ({meetings.length})
        </Typography>
        <Tooltip title="Refresh meetings">
          <IconButton onClick={loadMeetings} size="small">
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      <Box
        sx={{
          height: '300px',
          border: '1px solid #e0e0e0',
          borderRadius: 1,
          p: 2,
          overflow: 'auto',
          width: '100%',
        }}
      >
        {meetings.length === 0 ? (
          <Box
            sx={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography color="text.secondary">No upcoming meetings</Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {meetings.slice(0, 5).map((meeting) => {
              const meetingDate = new Date(meeting.scheduledDate);
              const dayOfWeek = meetingDate.toLocaleDateString('en-US', {
                weekday: 'short',
              });
              const dateString = meetingDate.toLocaleDateString();
              const timeString = meetingDate.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              });

              const isExpanded = expandedMeeting === meeting.id;
              const hasDetails = meeting.duration || meeting.notes;

              return (
                <Box
                  key={meeting.id}
                  sx={{
                    border: '1px solid #f0f0f0',
                    borderRadius: 1,
                    backgroundColor: '#fafafa',
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    sx={{
                      p: 2,
                      cursor: hasDetails ? 'pointer' : 'default',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      '&:hover': hasDetails
                        ? {
                            backgroundColor: '#f5f5f5',
                          }
                        : {},
                    }}
                    onClick={() =>
                      hasDetails && toggleMeetingExpansion(meeting.id)
                    }
                  >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 600, wordBreak: 'break-word' }}
                      >
                        {meeting.companyName}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ wordBreak: 'break-word' }}
                      >
                        {dayOfWeek}, {dateString} at {timeString}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ wordBreak: 'break-word' }}
                      >
                        {meeting.attendees.join(', ')}
                      </Typography>
                      {meeting.notes && !isExpanded && (
                        <Typography
                          variant="caption"
                          sx={{
                            fontStyle: 'italic',
                            color: 'text.secondary',
                            wordBreak: 'break-word',
                            whiteSpace: 'pre-wrap',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            mt: 0.5,
                          }}
                        >
                          {meeting.notes}
                        </Typography>
                      )}

                      {/* RSVP Status and Buttons */}
                      <Box
                        sx={{
                          mt: 1,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 1,
                        }}
                      >
                        {/* RSVP Buttons */}
                        {(() => {
                          const userRSVP = getCurrentUserRSVP(meeting);
                          return (
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <Button
                                size="small"
                                variant={
                                  userRSVP === 'going'
                                    ? 'contained'
                                    : 'outlined'
                                }
                                startIcon={<GoingIcon />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRSVP(meeting.id, 'going');
                                }}
                                disabled={rsvpLoading === meeting.id}
                                sx={{
                                  minWidth: 'auto',
                                  px: 1,
                                  fontSize: '0.7rem',
                                  backgroundColor:
                                    userRSVP === 'going'
                                      ? '#4caf50'
                                      : 'transparent',
                                  color:
                                    userRSVP === 'going' ? 'white' : '#4caf50',
                                  borderColor: '#4caf50',
                                  '&:hover': {
                                    backgroundColor:
                                      userRSVP === 'going'
                                        ? '#45a049'
                                        : 'rgba(76, 175, 80, 0.04)',
                                  },
                                  '& .MuiSvgIcon-root': {
                                    color:
                                      userRSVP === 'going'
                                        ? 'white'
                                        : '#4caf50',
                                  },
                                }}
                              >
                                Going
                              </Button>
                              <Button
                                size="small"
                                variant={
                                  userRSVP === 'not_going'
                                    ? 'contained'
                                    : 'outlined'
                                }
                                startIcon={<NotGoingIcon />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRSVP(meeting.id, 'not_going');
                                }}
                                disabled={rsvpLoading === meeting.id}
                                sx={{
                                  minWidth: 'auto',
                                  px: 1,
                                  fontSize: '0.7rem',
                                  backgroundColor:
                                    userRSVP === 'not_going'
                                      ? '#f44336'
                                      : 'transparent',
                                  color:
                                    userRSVP === 'not_going'
                                      ? 'white'
                                      : '#f44336',
                                  borderColor: '#f44336',
                                  '&:hover': {
                                    backgroundColor:
                                      userRSVP === 'not_going'
                                        ? '#d32f2f'
                                        : 'rgba(244, 67, 54, 0.04)',
                                  },
                                  '& .MuiSvgIcon-root': {
                                    color:
                                      userRSVP === 'not_going'
                                        ? 'white'
                                        : '#f44336',
                                  },
                                }}
                              >
                                Can't Go
                              </Button>
                            </Box>
                          );
                        })()}

                        {/* RSVP Responses Display */}
                        {meeting.rsvpDetails &&
                          Object.keys(meeting.rsvpDetails).length > 0 && (
                            <Box
                              sx={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: 0.5,
                              }}
                            >
                              {Object.entries(meeting.rsvpDetails).map(
                                ([userId, details]) => (
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
                                      fontSize: '0.65rem',
                                      height: '20px',
                                    }}
                                  />
                                )
                              )}
                            </Box>
                          )}
                      </Box>
                    </Box>
                    {hasDetails && (
                      <IconButton size="small" sx={{ ml: 1 }}>
                        {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    )}
                  </Box>

                  <Collapse in={isExpanded}>
                    <Box
                      sx={{
                        px: 2,
                        pb: 2,
                        borderTop: '1px solid #e0e0e0',
                        backgroundColor: '#f9f9f9',
                      }}
                    >
                      {meeting.duration && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 1 }}
                        >
                          <strong>Duration:</strong> {meeting.duration} minutes
                        </Typography>
                      )}
                      {meeting.notes && (
                        <Typography variant="body2" color="text.secondary">
                          <strong>Notes:</strong> {meeting.notes}
                        </Typography>
                      )}
                    </Box>
                  </Collapse>
                </Box>
              );
            })}
            {meetings.length > 5 && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ textAlign: 'center' }}
              >
                +{meetings.length - 5} more meetings
              </Typography>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
};
