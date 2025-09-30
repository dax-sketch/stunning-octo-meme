import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  Paper,
  CircularProgress,
} from '@mui/material';
import {
  Company,
  CreateCompanyData,
  UpdateCompanyData,
} from '../types/company';
import { companyService } from '../services/companyService';

interface CompanyFormProps {
  company?: Company;
  onSuccess: (company: Company) => void;
  onCancel: () => void;
}

interface FormData {
  name: string;
  startDate: string;
  phoneNumber: string;
  email: string;
  website: string;
  adSpend: string;
}

interface FormErrors {
  name?: string;
  startDate?: string;
  phoneNumber?: string;
  email?: string;
  website?: string;
  adSpend?: string;
}

export const CompanyForm: React.FC<CompanyFormProps> = ({
  company,
  onSuccess,
  onCancel,
}) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    startDate: '',
    phoneNumber: '',
    email: '',
    website: '',
    adSpend: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');

  const isEditing = !!company;

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name,
        startDate: company.startDate.split('T')[0], // Convert to YYYY-MM-DD format
        phoneNumber: company.phoneNumber,
        email: company.email,
        website: company.website,
        adSpend: company.adSpend.toString(),
      });
    }
  }, [company]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Company name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Company name must be at least 2 characters';
    }

    // Start date validation
    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    } else {
      const startDate = new Date(formData.startDate);
      const today = new Date();
      if (startDate > today) {
        newErrors.startDate = 'Start date cannot be in the future';
      }
    }

    // Phone number validation
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!phoneRegex.test(formData.phoneNumber.trim())) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Website validation
    const urlRegex = /^https?:\/\/.+\..+/;
    if (!formData.website.trim()) {
      newErrors.website = 'Website is required';
    } else if (!urlRegex.test(formData.website.trim())) {
      newErrors.website =
        'Please enter a valid website URL (include http:// or https://)';
    }

    // Weekly Ad spend validation
    const adSpend = parseFloat(formData.adSpend);
    if (!formData.adSpend.trim()) {
      newErrors.adSpend = 'Weekly Ad Spend is required';
    } else if (isNaN(adSpend) || adSpend < 0) {
      newErrors.adSpend = 'Weekly Ad Spend must be a valid positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange =
    (field: keyof FormData) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setFormData((prev) => ({ ...prev, [field]: value }));

      // Clear error for this field when user starts typing
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError('');

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const companyData = {
        name: formData.name.trim(),
        startDate: formData.startDate,
        phoneNumber: formData.phoneNumber.trim(),
        email: formData.email.trim(),
        website: formData.website.trim(),
        adSpend: parseFloat(formData.adSpend),
      };

      let response;
      if (isEditing && company) {
        response = await companyService.updateCompany(
          company.id,
          companyData as UpdateCompanyData
        );
      } else {
        response = await companyService.createCompany(
          companyData as CreateCompanyData
        );
      }

      if (response.success && response.data) {
        console.log('✅ Company saved successfully:', response.data);
        onSuccess(response.data as Company);
      } else {
        console.error('❌ Company save failed:', response.error);
        setSubmitError(
          response.error?.message ||
            'An error occurred while saving the company'
        );
      }
    } catch (error) {
      setSubmitError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h5" component="h2" gutterBottom>
        {isEditing ? 'Edit Company' : 'Add New Company'}
      </Typography>

      {submitError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {submitError}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
            gap: 2,
          }}
        >
          <Box>
            <TextField
              fullWidth
              label="Company Name"
              value={formData.name}
              onChange={handleInputChange('name')}
              error={!!errors.name}
              helperText={errors.name}
              required
            />
          </Box>

          <Box>
            <TextField
              fullWidth
              label="Start Date"
              type="date"
              value={formData.startDate}
              onChange={handleInputChange('startDate')}
              error={!!errors.startDate}
              helperText={errors.startDate}
              InputLabelProps={{ shrink: true }}
              required
            />
          </Box>

          <Box>
            <TextField
              fullWidth
              label="Weekly Ad Spend"
              type="number"
              value={formData.adSpend}
              onChange={handleInputChange('adSpend')}
              error={!!errors.adSpend}
              helperText={errors.adSpend}
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
              }}
              required
            />
          </Box>

          <Box>
            <TextField
              fullWidth
              label="Phone Number"
              value={formData.phoneNumber}
              onChange={handleInputChange('phoneNumber')}
              error={!!errors.phoneNumber}
              helperText={errors.phoneNumber}
              placeholder="+1 (555) 123-4567"
              required
            />
          </Box>

          <Box>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={handleInputChange('email')}
              error={!!errors.email}
              helperText={errors.email}
              required
            />
          </Box>

          <Box>
            <TextField
              fullWidth
              label="Website"
              value={formData.website}
              onChange={handleInputChange('website')}
              error={!!errors.website}
              helperText={errors.website}
              placeholder="https://example.com"
              required
            />
          </Box>
        </Box>

        <Box
          sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}
        >
          <Button variant="outlined" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
          >
            {isSubmitting
              ? 'Saving...'
              : isEditing
                ? 'Update Company'
                : 'Create Company'}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};
