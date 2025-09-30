import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Info as InfoIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
} from '@mui/icons-material';
import { tierService, CompanyNeedingReview } from '../services/tierService';

interface TierReviewPanelProps {
  onTierChanged?: () => void;
}

export const TierReviewPanel: React.FC<TierReviewPanelProps> = ({
  onTierChanged,
}) => {
  const [companies, setCompanies] = useState<CompanyNeedingReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingCompany, setProcessingCompany] = useState<string | null>(
    null
  );
  const [overrideDialog, setOverrideDialog] = useState<{
    open: boolean;
    company: CompanyNeedingReview | null;
    customTier: string;
    reason: string;
  }>({
    open: false,
    company: null,
    customTier: '',
    reason: '',
  });

  useEffect(() => {
    loadCompaniesNeedingReview();
  }, []);

  const loadCompaniesNeedingReview = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await tierService.getCompaniesNeedingReview();

      if (response.success && response.data) {
        setCompanies(response.data);
      } else {
        setError(
          response.error?.message || 'Failed to load companies needing review'
        );
      }
    } catch (error) {
      setError('Failed to load companies needing review. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveTierChange = async (company: CompanyNeedingReview) => {
    setProcessingCompany(company.$id);

    try {
      const response = await tierService.approveTierChange(
        company.$id,
        company.suggestedTier
      );

      if (response.success) {
        console.log('✅ Tier change approved for:', company.name);
        // Remove the company from the list
        setCompanies((prev) => prev.filter((c) => c.$id !== company.$id));
        // Trigger refresh of parent components
        console.log('🔄 Triggering tier change callback...');
        onTierChanged?.();
        // Additional refresh after a short delay to ensure backend update is complete
        setTimeout(() => {
          console.log('🔄 Triggering delayed tier change callback...');
          onTierChanged?.();
        }, 500);
      } else {
        console.error('❌ Failed to approve tier change:', response.error);
        setError(response.error?.message || 'Failed to approve tier change');
      }
    } catch (error) {
      setError('Failed to approve tier change. Please try again.');
    } finally {
      setProcessingCompany(null);
    }
  };

  const handleRejectTierChange = (company: CompanyNeedingReview) => {
    // Remove from the list without making changes
    setCompanies((prev) => prev.filter((c) => c.$id !== company.$id));
  };

  const handleCustomOverride = (company: CompanyNeedingReview) => {
    setOverrideDialog({
      open: true,
      company,
      customTier: company.suggestedTier,
      reason: '',
    });
  };

  const handleOverrideSubmit = async () => {
    if (!overrideDialog.company) return;

    setProcessingCompany(overrideDialog.company.$id);

    try {
      const response = await tierService.overrideTier(
        overrideDialog.company.$id,
        overrideDialog.customTier,
        overrideDialog.reason
      );

      if (response.success) {
        // Remove the company from the list
        setCompanies((prev) =>
          prev.filter((c) => c.$id !== overrideDialog.company!.$id)
        );
        setOverrideDialog({
          open: false,
          company: null,
          customTier: '',
          reason: '',
        });
        // Trigger refresh of parent components
        onTierChanged?.();
        // Additional refresh after a short delay to ensure backend update is complete
        setTimeout(() => onTierChanged?.(), 500);
      } else {
        setError(response.error?.message || 'Failed to override tier');
      }
    } catch (error) {
      setError('Failed to override tier. Please try again.');
    } finally {
      setProcessingCompany(null);
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

  const getTierChangeIcon = (currentTier: string, suggestedTier: string) => {
    const tierValues = { TIER_1: 1, TIER_2: 2, TIER_3: 3 };
    const current = tierValues[currentTier as keyof typeof tierValues];
    const suggested = tierValues[suggestedTier as keyof typeof tierValues];

    if (suggested < current) {
      return <TrendingUpIcon color="success" />;
    } else if (suggested > current) {
      return <TrendingDownIcon color="error" />;
    } else {
      return <TrendingFlatIcon color="action" />;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  if (companies.length === 0) {
    return (
      <Alert severity="info" sx={{ mb: 3 }}>
        No companies need tier review at this time. All companies are properly
        tiered according to the current criteria.
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Companies Needing Tier Review ({companies.length})
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        These companies have tier changes suggested based on the updated
        criteria. Review and approve or reject each change.
      </Typography>

      <Box
        display="flex"
        flexWrap="wrap"
        gap={2}
        sx={{
          '& > *': {
            flex: {
              xs: '1 1 100%', // Full width on mobile
              md: '1 1 calc(50% - 8px)', // Half width on medium screens
              lg: '1 1 calc(33.333% - 11px)', // Third width on large screens
            },
            minWidth: '300px', // Minimum card width
          },
        }}
      >
        {companies.map((company) => (
          <Card key={company.$id}>
            <CardContent>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="flex-start"
                mb={2}
              >
                <Typography variant="h6" component="h3">
                  {company.name}
                </Typography>
                <Tooltip title="Tier change direction">
                  <IconButton size="small">
                    {getTierChangeIcon(company.tier, company.suggestedTier)}
                  </IconButton>
                </Tooltip>
              </Box>

              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Chip
                  label={getTierLabel(company.tier)}
                  color={getTierColor(company.tier) as any}
                  size="small"
                />
                <Typography variant="body2">→</Typography>
                <Chip
                  label={getTierLabel(company.suggestedTier)}
                  color={getTierColor(company.suggestedTier) as any}
                  size="small"
                  variant="outlined"
                />
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {company.reason}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Box display="flex" gap={1} flexWrap="wrap">
                <Button
                  size="small"
                  variant="contained"
                  color="success"
                  startIcon={<ApproveIcon />}
                  onClick={() => handleApproveTierChange(company)}
                  disabled={processingCompany === company.$id}
                >
                  Approve
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  startIcon={<RejectIcon />}
                  onClick={() => handleRejectTierChange(company)}
                  disabled={processingCompany === company.$id}
                >
                  Reject
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<InfoIcon />}
                  onClick={() => handleCustomOverride(company)}
                  disabled={processingCompany === company.$id}
                >
                  Custom
                </Button>
              </Box>

              {processingCompany === company.$id && (
                <Box display="flex" justifyContent="center" mt={2}>
                  <CircularProgress size={20} />
                </Box>
              )}
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Custom Override Dialog */}
      <Dialog
        open={overrideDialog.open}
        onClose={() =>
          setOverrideDialog({
            open: false,
            company: null,
            customTier: '',
            reason: '',
          })
        }
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Custom Tier Override - {overrideDialog.company?.name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Current: {getTierLabel(overrideDialog.company?.tier || '')} →
              Suggested:{' '}
              {getTierLabel(overrideDialog.company?.suggestedTier || '')}
            </Typography>

            <TextField
              select
              fullWidth
              label="Override Tier"
              value={overrideDialog.customTier}
              onChange={(e) =>
                setOverrideDialog((prev) => ({
                  ...prev,
                  customTier: e.target.value,
                }))
              }
              SelectProps={{ native: true }}
              sx={{ mb: 2 }}
            >
              <option value="TIER_1">
                Tier 1 (High Weekly Ad Spend & Established)
              </option>
              <option value="TIER_2">Tier 2 (New Company)</option>
              <option value="TIER_3">
                Tier 3 (Low Weekly Ad Spend & Established)
              </option>
            </TextField>

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Reason for Override"
              value={overrideDialog.reason}
              onChange={(e) =>
                setOverrideDialog((prev) => ({
                  ...prev,
                  reason: e.target.value,
                }))
              }
              placeholder="Explain why this tier override is necessary..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              setOverrideDialog({
                open: false,
                company: null,
                customTier: '',
                reason: '',
              })
            }
          >
            Cancel
          </Button>
          <Button
            onClick={handleOverrideSubmit}
            variant="contained"
            disabled={
              !overrideDialog.customTier ||
              processingCompany === overrideDialog.company?.$id
            }
          >
            Apply Override
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
