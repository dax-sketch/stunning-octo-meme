import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Alert,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { Company, CompanyFilters, TIER_LABELS } from '../types/company';
import { companyService } from '../services/companyService';
import { CompanyCard } from './CompanyCard';
import { useNavigate } from 'react-router-dom';

interface CompanyListProps {
  onAddCompany: () => void;
  onEditCompany: (company: Company) => void;
  onViewCompany: (company: Company) => void;
  refreshTrigger?: number; // Used to trigger refresh from parent
}

export const CompanyList: React.FC<CompanyListProps> = ({
  onAddCompany,
  onEditCompany,
  onViewCompany,
  refreshTrigger,
}) => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [filters, setFilters] = useState<CompanyFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    company: Company | null;
  }>({ open: false, company: null });
  const [deleting, setDeleting] = useState(false);

  const loadCompanies = async () => {
    console.log('📋 Loading companies...');
    setLoading(true);
    setError('');

    try {
      const response = await companyService.getCompanies();
      if (response.success && Array.isArray(response.data)) {
        console.log('✅ Companies loaded:', response.data.length, 'companies');
        setCompanies(response.data);
      } else {
        console.error('❌ Failed to load companies:', response.error);
        setError(response.error?.message || 'Failed to load companies');
      }
    } catch (err) {
      console.error('❌ Error loading companies:', err);
      setError('An unexpected error occurred while loading companies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log(
      '🔄 CompanyList refresh triggered, refreshTrigger:',
      refreshTrigger
    );
    loadCompanies();
  }, [refreshTrigger]);

  useEffect(() => {
    // Apply filters and search
    let filtered = [...companies];

    // Apply tier filter
    if (filters.tier) {
      filtered = filtered.filter((company) => company.tier === filters.tier);
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        (company) =>
          company.name.toLowerCase().includes(search) ||
          company.email.toLowerCase().includes(search) ||
          company.website.toLowerCase().includes(search) ||
          company.phoneNumber.includes(search)
      );
    }

    // Sort by creation date (newest first)
    filtered.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    setFilteredCompanies(filtered);
  }, [companies, filters, searchTerm]);

  const handleTierFilterChange = (tier: string) => {
    setFilters((prev) => ({
      ...prev,
      tier: tier === 'all' ? undefined : (tier as Company['tier']),
    }));
  };

  const handleDeleteClick = (company: Company) => {
    setDeleteDialog({ open: true, company });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.company) return;

    setDeleting(true);
    try {
      const response = await companyService.deleteCompany(
        deleteDialog.company.id
      );
      if (response.success) {
        // Remove from local state immediately
        setCompanies((prev) =>
          prev.filter((c) => c.id !== deleteDialog.company!.id)
        );
        setDeleteDialog({ open: false, company: null });

        // Also reload the list to ensure consistency
        setTimeout(() => {
          loadCompanies();
        }, 500);
      } else {
        setError(response.error?.message || 'Failed to delete company');
        setDeleteDialog({ open: false, company: null });
      }
    } catch (err) {
      setError('An unexpected error occurred while deleting the company');
      setDeleteDialog({ open: false, company: null });
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, company: null });
  };

  const getCompanyStats = () => {
    const stats = {
      total: companies.length,
      tier1: companies.filter((c) => c.tier === 'TIER_1').length,
      tier2: companies.filter((c) => c.tier === 'TIER_2').length,
      tier3: companies.filter((c) => c.tier === 'TIER_3').length,
    };
    return stats;
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

  const stats = getCompanyStats();

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/dashboard')}
            sx={{ minWidth: 'auto' }}
          >
            Back to Dashboard
          </Button>
          <Typography variant="h4" component="h1">
            Companies ({stats.total})
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onAddCompany}
        >
          Add Company
        </Button>
      </Box>

      {/* Filters */}
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          mb: 3,
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            placeholder="Search companies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ minWidth: 300 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />

          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Filter by Tier</InputLabel>
            <Select
              value={filters.tier || 'all'}
              onChange={(e) => handleTierFilterChange(e.target.value)}
              label="Filter by Tier"
              startAdornment={<FilterIcon sx={{ mr: 1 }} />}
            >
              <MenuItem value="all">All Tiers</MenuItem>
              <MenuItem value="TIER_1">{TIER_LABELS.TIER_1}</MenuItem>
              <MenuItem value="TIER_2">{TIER_LABELS.TIER_2}</MenuItem>
              <MenuItem value="TIER_3">{TIER_LABELS.TIER_3}</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Stats - moved to the right */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Typography variant="body2" color="text.secondary">
            Tier 1: {stats.tier1}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Tier 2: {stats.tier2}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Tier 3: {stats.tier3}
          </Typography>
        </Box>
      </Box>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Companies Grid */}
      {filteredCompanies.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {companies.length === 0
              ? 'No companies found'
              : 'No companies match your filters'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {companies.length === 0
              ? 'Get started by adding your first company'
              : 'Try adjusting your search or filter criteria'}
          </Typography>
          {companies.length === 0 && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={onAddCompany}
              sx={{ mt: 2 }}
            >
              Add First Company
            </Button>
          )}
        </Box>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
            },
            gap: 3,
          }}
        >
          {filteredCompanies.map((company) => (
            <Box key={company.id}>
              <CompanyCard
                company={company}
                onEdit={onEditCompany}
                onDelete={handleDeleteClick}
                onView={onViewCompany}
              />
            </Box>
          ))}
        </Box>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={handleDeleteCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Delete Company</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{deleteDialog.company?.name}"? This
            action cannot be undone and will remove all associated data.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={deleting}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={20} /> : null}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
