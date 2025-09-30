import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Business as BusinessIcon,
  Payment as PaymentIcon,
  Event as EventIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import { dashboardService } from '../services/dashboardService';
import {
  DashboardMetrics,
  AuditStatistics,
  QuickAction,
} from '../types/dashboard';
import { UpcomingMeetings } from './UpcomingMeetings';
import { UpcomingAuditsSection } from './UpcomingAuditsSection';

export const DashboardOverview: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [auditStats, setAuditStats] = useState<AuditStatistics | null>(null);
  const [upcomingAudits, setUpcomingAudits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const quickActions: QuickAction[] = [
    {
      id: 'view-companies',
      label: 'VIEW COMPANIES',
      icon: 'business',
      path: '/companies',
      color: 'primary',
    },
    {
      id: 'schedule-meeting',
      label: 'SCHEDULE MEETING',
      icon: 'event',
      path: '/companies?action=schedule-meeting',
      color: 'secondary',
    },
    {
      id: 'make-payment',
      label: 'MAKE A PAYMENT',
      icon: 'payment',
      path: '/companies?action=payment',
      color: 'warning',
    },
  ];

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [metricsResult, auditStatsResult, upcomingAuditsResult] =
        await Promise.all([
          dashboardService.getDashboardMetrics(),
          dashboardService.getAuditStatistics(),
          dashboardService.getUpcomingAudits(30), // Changed from 7 to 30 days
        ]);

      if (metricsResult.success) {
        setMetrics(metricsResult.data!);
      } else {
        console.error('Failed to load metrics:', metricsResult.error);
      }

      if (auditStatsResult.success) {
        setAuditStats(auditStatsResult.data!);
      } else {
        console.error('Failed to load audit stats:', auditStatsResult.error);
      }

      if (upcomingAuditsResult.success) {
        console.log('✅ Upcoming audits loaded:', upcomingAuditsResult.data);
        setUpcomingAudits(upcomingAuditsResult.data || []);
      } else {
        console.error(
          '❌ Failed to load upcoming audits:',
          upcomingAuditsResult.error
        );
      }
    } catch (err) {
      setError('Failed to load dashboard data. Please try again.');
      console.error('Dashboard loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (action: QuickAction) => {
    if (action.id === 'schedule-meeting') {
      // Handle schedule meeting action specially
      navigate('/schedule-meeting');
    } else if (action.id === 'make-payment') {
      // Handle make payment action specially
      navigate('/make-payment');
    } else {
      navigate(action.path);
    }
  };

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

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
        <Button onClick={loadDashboardData} sx={{ ml: 2 }}>
          Retry
        </Button>
      </Alert>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Key Metrics Cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
          },
          gap: 4,
          mb: 4,
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Total Companies
          </Typography>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            gap={2}
          >
            <Typography variant="h3" sx={{ fontWeight: 300 }}>
              {metrics?.totalCompanies || 0}
            </Typography>
            <BusinessIcon sx={{ fontSize: 32, color: '#2196f3' }} />
          </Box>
        </Box>

        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Recent Payments
          </Typography>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            gap={2}
          >
            <Typography variant="h3" sx={{ fontWeight: 300 }}>
              {metrics?.recentPayments || 0}
            </Typography>
            <PaymentIcon sx={{ fontSize: 32, color: '#4caf50' }} />
          </Box>
          <Typography variant="caption" color="text.secondary">
            Last 30 days
          </Typography>
        </Box>

        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Upcoming Meetings
          </Typography>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            gap={2}
          >
            <Typography variant="h3" sx={{ fontWeight: 300 }}>
              {metrics?.upcomingMeetings || 0}
            </Typography>
            <EventIcon sx={{ fontSize: 32, color: '#ff9800' }} />
          </Box>
          <Typography variant="caption" color="text.secondary">
            Next 30 days
          </Typography>
        </Box>
      </Box>

      {/* Quick Actions */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 400 }}>
          Quick Actions
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
            },
            gap: 2,
          }}
        >
          {quickActions.map((action) => (
            <Button
              key={action.id}
              variant="outlined"
              fullWidth
              onClick={() => handleQuickAction(action)}
              sx={{
                height: '80px',
                flexDirection: 'column',
                gap: 1,
                borderColor: '#e0e0e0',
                color: '#2196f3',
                '&:hover': {
                  borderColor: '#2196f3',
                  backgroundColor: 'rgba(33, 150, 243, 0.04)',
                },
              }}
            >
              {action.icon === 'business' && <BusinessIcon />}
              {action.icon === 'event' && <EventIcon />}
              {action.icon === 'payment' && <PaymentIcon />}
              <Typography
                variant="caption"
                sx={{ fontSize: '0.75rem', textTransform: 'uppercase' }}
              >
                {action.label}
              </Typography>
            </Button>
          ))}
        </Box>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
          gap: 4,
          mb: 4,
        }}
      >
        {/* Upcoming Meetings */}
        <UpcomingMeetings />

        {/* Upcoming Audits */}
        <UpcomingAuditsSection
          audits={upcomingAudits}
          onRefresh={loadDashboardData}
        />
      </Box>
    </Box>
  );
};
