import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Button,
  Chip,
  Tooltip,
  Card,
  CardContent,
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Today as TodayIcon,
  CalendarToday as CalendarIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { Audit } from '../types/audit';

interface AuditCalendarViewProps {
  audits: Audit[];
  onAuditClick: (audit: Audit) => void;
  onDateClick?: (date: Date) => void;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  audits: Audit[];
}

export const AuditCalendarView: React.FC<AuditCalendarViewProps> = ({
  audits,
  onAuditClick,
  onDateClick,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Get first day of the month and adjust for week start (Sunday = 0)
    const firstDay = new Date(year, month, 1);

    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Generate 42 days (6 weeks)
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);

      const dayAudits = audits.filter((audit) => {
        const auditDate = new Date(audit.scheduledDate);
        return (
          auditDate.getFullYear() === date.getFullYear() &&
          auditDate.getMonth() === date.getMonth() &&
          auditDate.getDate() === date.getDate()
        );
      });

      days.push({
        date: new Date(date),
        isCurrentMonth: date.getMonth() === month,
        isToday: date.getTime() === today.getTime(),
        audits: dayAudits,
      });
    }

    return days;
  }, [currentDate, audits]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon fontSize="small" color="success" />;
      case 'in_progress':
        return <ScheduleIcon fontSize="small" color="primary" />;
      case 'overdue':
        return <WarningIcon fontSize="small" color="error" />;
      default:
        return <CalendarIcon fontSize="small" color="action" />;
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

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Paper elevation={1} sx={{ p: 3 }}>
      {/* Calendar Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h5" component="h2">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </Typography>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<TodayIcon />}
            onClick={goToToday}
          >
            Today
          </Button>
          <IconButton onClick={() => navigateMonth('prev')}>
            <ChevronLeftIcon />
          </IconButton>
          <IconButton onClick={() => navigateMonth('next')}>
            <ChevronRightIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Calendar Grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 1,
        }}
      >
        {/* Day Headers */}
        {dayNames.map((day) => (
          <Box
            key={day}
            sx={{
              p: 1,
              textAlign: 'center',
              fontWeight: 'bold',
              color: 'text.secondary',
              borderBottom: 1,
              borderColor: 'divider',
            }}
          >
            {day}
          </Box>
        ))}

        {/* Calendar Days */}
        {calendarDays.map((day, index) => (
          <Card
            key={index}
            variant="outlined"
            sx={{
              minHeight: 120,
              cursor: onDateClick ? 'pointer' : 'default',
              backgroundColor: day.isCurrentMonth
                ? 'background.paper'
                : 'action.hover',
              border: day.isToday ? 2 : 1,
              borderColor: day.isToday ? 'primary.main' : 'divider',
              '&:hover': onDateClick
                ? {
                    backgroundColor: 'action.hover',
                  }
                : {},
            }}
            onClick={() => onDateClick?.(day.date)}
          >
            <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: day.isToday ? 'bold' : 'normal',
                  color: day.isCurrentMonth ? 'text.primary' : 'text.secondary',
                  mb: 1,
                }}
              >
                {day.date.getDate()}
              </Typography>

              {/* Audits for this day */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {day.audits.slice(0, 2).map((audit) => (
                  <Tooltip
                    key={audit.id}
                    title={`${audit.companyName} - Assigned to: ${audit.assignedTo}`}
                  >
                    <Chip
                      size="small"
                      icon={getStatusIcon(audit.status)}
                      label={audit.companyName}
                      color={getStatusColor(audit.status) as any}
                      onClick={(e) => {
                        e.stopPropagation();
                        onAuditClick(audit);
                      }}
                      sx={{
                        fontSize: '0.7rem',
                        height: 20,
                        cursor: 'pointer',
                        '& .MuiChip-label': {
                          px: 0.5,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '80px',
                        },
                      }}
                    />
                  </Tooltip>
                ))}

                {day.audits.length > 2 && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ textAlign: 'center', fontSize: '0.7rem' }}
                  >
                    +{day.audits.length - 2} more
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Paper>
  );
};
