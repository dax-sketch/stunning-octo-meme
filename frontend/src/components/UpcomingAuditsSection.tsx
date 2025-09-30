import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { TIER_LABELS, TIER_COLORS } from '../types/company';

interface UpcomingAudit {
  id: string;
  companyId: string;
  companyName: string;
  companyTier?: 'TIER_1' | 'TIER_2' | 'TIER_3';
  scheduledDate: string;
  assignedTo: string;
  assignedToUsername?: string;
  status: string;
  notes?: string;
}

interface UpcomingAuditsSectionProps {
  audits: UpcomingAudit[];
  onRefresh: () => void;
}

interface GroupedAudits {
  [date: string]: {
    audits: UpcomingAudit[];
    dateObj: Date;
  };
}

export const UpcomingAuditsSection: React.FC<UpcomingAuditsSectionProps> = ({
  audits,
  onRefresh,
}) => {
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

  // Group audits by date
  const groupedAudits: GroupedAudits = audits.reduce((groups, audit) => {
    const auditDate = new Date(audit.scheduledDate);
    const dateKey = auditDate.toDateString();

    if (!groups[dateKey]) {
      groups[dateKey] = {
        audits: [],
        dateObj: auditDate,
      };
    }

    groups[dateKey].audits.push(audit);
    return groups;
  }, {} as GroupedAudits);

  // Sort dates chronologically
  const sortedDates = Object.keys(groupedAudits).sort((a, b) => {
    return (
      groupedAudits[a].dateObj.getTime() - groupedAudits[b].dateObj.getTime()
    );
  });

  // Sort audits within each date by tier (Tier 1, Tier 2, Tier 3)
  const sortAuditsByTier = (audits: UpcomingAudit[]) => {
    const tierOrder = { TIER_1: 1, TIER_2: 2, TIER_3: 3 };

    return audits.sort((a, b) => {
      const tierA = a.companyTier || 'TIER_3';
      const tierB = b.companyTier || 'TIER_3';

      // First sort by tier
      const tierComparison = tierOrder[tierA] - tierOrder[tierB];
      if (tierComparison !== 0) {
        return tierComparison;
      }

      // Then sort alphabetically by company name within the same tier
      return a.companyName.localeCompare(b.companyName);
    });
  };

  const handleDateToggle = (dateKey: string) => {
    const newExpanded = new Set(expandedDates);
    if (newExpanded.has(dateKey)) {
      newExpanded.delete(dateKey);
    } else {
      newExpanded.add(dateKey);
    }
    setExpandedDates(newExpanded);
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      });
    }
  };

  return (
    <Box sx={{ width: '100%', minWidth: 0 }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <Typography variant="h6" sx={{ fontWeight: 400 }}>
          Upcoming Audits ({audits.length})
        </Typography>
        <Tooltip title="Refresh audits">
          <IconButton onClick={onRefresh} size="small">
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Box
        sx={{
          height: '300px',
          border: '1px solid #e0e0e0',
          borderRadius: 1,
          overflow: 'auto',
          width: '100%',
        }}
      >
        {audits.length === 0 ? (
          <Box
            sx={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              p: 2,
            }}
          >
            <Typography color="text.secondary">No upcoming audits</Typography>
          </Box>
        ) : (
          <Box>
            {sortedDates.map((dateKey) => {
              const { audits: dateAudits, dateObj } = groupedAudits[dateKey];
              const sortedAudits = sortAuditsByTier(dateAudits);
              const isExpanded = expandedDates.has(dateKey);

              return (
                <Accordion
                  key={dateKey}
                  expanded={isExpanded}
                  onChange={() => handleDateToggle(dateKey)}
                  sx={{
                    boxShadow: 'none',
                    border: 'none',
                    '&:before': { display: 'none' },
                    '&.Mui-expanded': { margin: 0 },
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{
                      minHeight: 48,
                      '&.Mui-expanded': { minHeight: 48 },
                      px: 2,
                      borderBottom: '1px solid #f0f0f0',
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={2}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {formatDate(dateObj)}
                      </Typography>
                      <Chip
                        label={`${dateAudits.length} audit${dateAudits.length !== 1 ? 's' : ''}`}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.75rem' }}
                      />
                    </Box>
                  </AccordionSummary>

                  <AccordionDetails sx={{ px: 2, py: 1 }}>
                    <Box
                      sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}
                    >
                      {sortedAudits.map((audit) => {
                        const tier = audit.companyTier || 'TIER_3';

                        return (
                          <Box
                            key={audit.id}
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              py: 1,
                              px: 2,
                              backgroundColor: '#fafafa',
                              borderRadius: 1,
                              border: '1px solid #f0f0f0',
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 500 }}
                            >
                              {audit.companyName}
                            </Typography>
                            <Chip
                              label={TIER_LABELS[tier]}
                              size="small"
                              sx={{
                                backgroundColor: TIER_COLORS[tier],
                                color: 'white',
                                fontWeight: 'bold',
                                fontSize: '0.7rem',
                              }}
                            />
                          </Box>
                        );
                      })}
                    </Box>
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </Box>
        )}
      </Box>
    </Box>
  );
};
