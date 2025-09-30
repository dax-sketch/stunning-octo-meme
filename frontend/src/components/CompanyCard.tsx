import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Box,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Business as BusinessIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Language as WebsiteIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { Company, TIER_LABELS, TIER_COLORS } from '../types/company';

interface CompanyCardProps {
  company: Company;
  onEdit: (company: Company) => void;
  onDelete: (company: Company) => void;
  onView: (company: Company) => void;
}

export const CompanyCard: React.FC<CompanyCardProps> = ({
  company,
  onEdit,
  onDelete,
  onView,
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
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
    const startDate = new Date(company.startDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 30) {
      return `${diffDays} days`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months > 1 ? 's' : ''}`;
    } else {
      const years = Math.floor(diffDays / 365);
      const remainingMonths = Math.floor((diffDays % 365) / 30);
      return `${years} year${years > 1 ? 's' : ''}${remainingMonths > 0 ? `, ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}` : ''}`;
    }
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 4,
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 2,
          }}
        >
          <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold' }}>
            {company.name}
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

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BusinessIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              Started: {formatDate(company.startDate)} ({getCompanyAge()})
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MoneyIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              Weekly Ad Spend: {formatCurrency(company.adSpend)}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PhoneIcon fontSize="small" color="action" />
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ wordBreak: 'break-word' }}
            >
              {company.phoneNumber}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EmailIcon fontSize="small" color="action" />
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ wordBreak: 'break-word' }}
            >
              {company.email}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WebsiteIcon fontSize="small" color="action" />
            <Typography
              variant="body2"
              color="primary"
              component="a"
              href={company.website}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                textDecoration: 'none',
                wordBreak: 'break-word',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              {company.website}
            </Typography>
          </Box>
        </Box>

        {(company.lastPaymentDate || company.lastMeetingDate) && (
          <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            {company.lastPaymentDate && (
              <Typography variant="body2" color="text.secondary">
                Last Payment: {formatDate(company.lastPaymentDate)}
                {company.lastPaymentAmount &&
                  ` - ${formatCurrency(company.lastPaymentAmount)}`}
              </Typography>
            )}
            {company.lastMeetingDate && (
              <Typography variant="body2" color="text.secondary">
                Last Meeting: {formatDate(company.lastMeetingDate)}
                {company.lastMeetingAttendees &&
                  company.lastMeetingAttendees.length > 0 && (
                    <span> - {company.lastMeetingAttendees.join(', ')}</span>
                  )}
              </Typography>
            )}
          </Box>
        )}
      </CardContent>

      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
        <Button size="small" variant="outlined" onClick={() => onView(company)}>
          View Details
        </Button>

        <Box>
          <Tooltip title="Edit Company">
            <IconButton
              size="small"
              onClick={() => onEdit(company)}
              color="primary"
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Company">
            <IconButton
              size="small"
              onClick={() => onDelete(company)}
              color="error"
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </CardActions>
    </Card>
  );
};
