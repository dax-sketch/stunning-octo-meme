import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Company } from '../types/company';
import { companyService } from '../services/companyService';

interface PaymentDataFormProps {
  open: boolean;
  onClose: () => void;
  company: Company;
  onSuccess: (updatedCompany: Company) => void;
}

export const PaymentDataForm: React.FC<PaymentDataFormProps> = ({
  open,
  onClose,
  company,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    lastPaymentDate: company.lastPaymentDate
      ? company.lastPaymentDate.split('T')[0]
      : '',
    lastPaymentAmount: company.lastPaymentAmount || 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.lastPaymentDate || !formData.lastPaymentAmount) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.lastPaymentAmount <= 0) {
      setError('Payment amount must be greater than 0');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await companyService.updatePaymentData(company.id, {
        lastPaymentDate: formData.lastPaymentDate,
        lastPaymentAmount: formData.lastPaymentAmount,
      });

      if (response.success && response.data) {
        onSuccess(response.data as Company);
        onClose();
      } else {
        setError(response.error?.message || 'Failed to update payment data');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError('');
      setFormData({
        lastPaymentDate: company.lastPaymentDate
          ? company.lastPaymentDate.split('T')[0]
          : '',
        lastPaymentAmount: company.lastPaymentAmount || 0,
      });
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Update Payment Data</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}

            <TextField
              label="Payment Date"
              type="date"
              value={formData.lastPaymentDate}
              onChange={(e) =>
                handleInputChange('lastPaymentDate', e.target.value)
              }
              required
              fullWidth
              InputLabelProps={{
                shrink: true,
              }}
              disabled={loading}
            />

            <TextField
              label="Payment Amount"
              type="number"
              value={formData.lastPaymentAmount}
              onChange={(e) =>
                handleInputChange(
                  'lastPaymentAmount',
                  parseFloat(e.target.value) || 0
                )
              }
              required
              fullWidth
              inputProps={{
                min: 0,
                step: 0.01,
              }}
              disabled={loading}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Updating...' : 'Update Payment Data'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
