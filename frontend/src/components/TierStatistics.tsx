import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Business as BusinessIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import {
  tierService,
  TierStatistics as TierStatsType,
} from '../services/tierService';

export const TierStatistics: React.FC = () => {
  const [statistics, setStatistics] = useState<TierStatsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await tierService.getTierStatistics();

      if (response.success && response.data) {
        setStatistics(response.data);
      } else {
        setError(response.error?.message || 'Failed to load tier statistics');
      }
    } catch (error) {
      setError('Failed to load tier statistics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'TIER_1':
        return 'success';
      case 'TIER_2':
        return 'warning';
      case 'TIER_3':
        return 'error';
      default:
        return 'default';
    }
  };

  const getTierLabel = (tier: string) => {
    switch (tier) {
      case 'TIER_1':
        return 'Tier 1';
      case 'TIER_2':
        return 'Tier 2';
      case 'TIER_3':
        return 'Tier 3';
      default:
        return tier;
    }
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

  if (!statistics) {
    return null;
  }

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <BusinessIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6" component="h3">
            Company Tiers
          </Typography>
        </Box>

        <Box display="grid" gridTemplateColumns="repeat(3, 1fr)" gap={2}>
          {Object.entries(statistics.distribution).map(([tier, count]) => (
            <Box textAlign="center" key={tier}>
              <Typography variant="h4" color="primary">
                {count}
              </Typography>
              <Chip
                label={getTierLabel(tier)}
                color={getTierColor(tier) as any}
                size="small"
              />
            </Box>
          ))}
        </Box>

        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mt={2}
          pt={2}
          sx={{ borderTop: 1, borderColor: 'divider' }}
        >
          <Box display="flex" alignItems="center">
            <TrendingUpIcon color="action" sx={{ mr: 0.5, fontSize: 16 }} />
            <Typography variant="body2" color="text.secondary">
              {statistics.recentChanges} changes (7 days)
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Total: {statistics.totalCompanies}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};
