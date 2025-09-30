import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Payment as PaymentIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Company } from '../types/company';
import { companyService } from '../services/companyService';
import { paymentService, CreatePaymentData } from '../services/paymentService';

interface PaymentFormData {
  companyId: string;
  amount: string;
  paymentDate: string;
  notes: string;
}

export const MakePaymentForm: React.FC = () => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [formData, setFormData] = useState<PaymentFormData>({
    companyId: '',
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0], // Today's date
    notes: '',
  });
  const [errors, setErrors] = useState<Partial<PaymentFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      const response = await companyService.getCompanies();
      if (response.success && Array.isArray(response.data)) {
        // Sort companies alphabetically
        const sortedCompanies = response.data.sort((a, b) =>
          a.name.localeCompare(b.name)
        );
        setCompanies(sortedCompanies);
      } else {
        console.error('Failed to load companies:', response.error);
      }
    } catch (error) {
      console.error('Error loading companies:', error);
    } finally {
      setLoadingCompanies(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<PaymentFormData> = {};

    // Company validation
    if (!formData.companyId.trim()) {
      newErrors.companyId = 'Company is required';
    }

    // Amount validation
    const amount = parseFloat(formData.amount);
    if (!formData.amount.trim()) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(amount) || amount <= 0) {
      newErrors.amount = 'Amount must be a positive number';
    }

    // Payment date validation
    if (!formData.paymentDate.trim()) {
      newErrors.paymentDate = 'Payment date is required';
    } else {
      const paymentDate = new Date(formData.paymentDate);
      if (isNaN(paymentDate.getTime())) {
        newErrors.paymentDate = 'Invalid payment date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const paymentData: CreatePaymentData = {
        companyId: formData.companyId,
        amount: parseFloat(formData.amount),
        paymentDate: new Date(formData.paymentDate),
        notes: formData.notes.trim() || undefined,
      };

      const response = await paymentService.createPayment(paymentData);

      if (response.success) {
        console.log('✅ Payment recorded successfully:', response.data);
        setSubmitSuccess(true);

        // Reset form
        setFormData({
          companyId: '',
          amount: '',
          paymentDate: new Date().toISOString().split('T')[0],
          notes: '',
        });

        // Navigate back to dashboard after a short delay
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        setSubmitError(response.error?.message || 'Failed to record payment');
      }
    } catch (error) {
      setSubmitError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFieldChange = (field: keyof PaymentFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const selectedCompany = companies.find((c) => c.id === formData.companyId);

  if (submitSuccess) {
    return (
      <Box sx={{ maxWidth: 600, mx: 'auto', p: 3 }}>
        <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
          <PaymentIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom color="success.main">
            Payment Recorded Successfully!
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            The payment has been recorded and the company's payment history has
            been updated.
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/dashboard')}
            startIcon={<ArrowBackIcon />}
          >
            Back to Dashboard
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/dashboard')}
          sx={{ mr: 2 }}
        >
          Back to Dashboard
        </Button>
      </Box>

      <Paper elevation={2} sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <PaymentIcon sx={{ fontSize: 32, color: 'primary.main', mr: 2 }} />
          <Typography variant="h6">Payment Details</Typography>
        </Box>

        {submitError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {submitError}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Company Selection */}
            <FormControl fullWidth error={!!errors.companyId}>
              <InputLabel>Company *</InputLabel>
              <Select
                value={formData.companyId}
                onChange={(e) => handleFieldChange('companyId', e.target.value)}
                label="Company *"
                disabled={loadingCompanies}
              >
                {loadingCompanies ? (
                  <MenuItem disabled>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    Loading companies...
                  </MenuItem>
                ) : (
                  companies.map((company) => (
                    <MenuItem key={company.id} value={company.id}>
                      <Box>
                        <Typography variant="body1">{company.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Last payment:{' '}
                          {company.lastPaymentDate
                            ? `${formatCurrency(company.lastPaymentAmount || 0)} on ${new Date(company.lastPaymentDate).toLocaleDateString()}`
                            : 'No previous payments'}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))
                )}
              </Select>
              {errors.companyId && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                  {errors.companyId}
                </Typography>
              )}
            </FormControl>

            {/* Amount */}
            <TextField
              fullWidth
              label="Payment Amount *"
              type="number"
              value={formData.amount}
              onChange={(e) => handleFieldChange('amount', e.target.value)}
              error={!!errors.amount}
              helperText={errors.amount}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <MoneyIcon />
                  </InputAdornment>
                ),
                inputProps: { min: 0, step: 0.01 },
              }}
            />

            {/* Payment Date */}
            <TextField
              fullWidth
              label="Payment Date *"
              type="date"
              value={formData.paymentDate}
              onChange={(e) => handleFieldChange('paymentDate', e.target.value)}
              error={!!errors.paymentDate}
              helperText={errors.paymentDate}
              InputLabelProps={{
                shrink: true,
              }}
            />

            {/* Notes */}
            <TextField
              fullWidth
              label="Notes (Optional)"
              multiline
              rows={3}
              value={formData.notes}
              onChange={(e) => handleFieldChange('notes', e.target.value)}
              placeholder="Add any additional notes about this payment..."
            />

            {/* Company Info Preview */}
            {selectedCompany && (
              <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
                <Typography variant="subtitle2" gutterBottom>
                  Payment Summary
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Company: {selectedCompany.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Amount:{' '}
                  {formData.amount
                    ? formatCurrency(parseFloat(formData.amount))
                    : '$0'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Date:{' '}
                  {formData.paymentDate
                    ? new Date(formData.paymentDate).toLocaleDateString()
                    : 'Not selected'}
                </Typography>
              </Paper>
            )}

            {/* Submit Button */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/dashboard')}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting}
                startIcon={
                  isSubmitting ? (
                    <CircularProgress size={20} />
                  ) : (
                    <PaymentIcon />
                  )
                }
              >
                {isSubmitting ? 'Recording Payment...' : 'Record Payment'}
              </Button>
            </Box>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};
