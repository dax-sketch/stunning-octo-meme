import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { CompanyForm } from '../CompanyForm';
import { companyService } from '../../services/companyService';
import { Company } from '../../types/company';

// Mock the company service
jest.mock('../../services/companyService');
const mockCompanyService = companyService as jest.Mocked<typeof companyService>;

const mockCompany: Company = {
  id: '1',
  name: 'Test Company',
  startDate: '2023-01-01T00:00:00.000Z',
  phoneNumber: '+1234567890',
  email: 'test@company.com',
  website: 'https://testcompany.com',
  tier: 'TIER_1',
  adSpend: 5000,
  createdBy: 'user1',
  createdAt: '2023-01-01T00:00:00.000Z',
  updatedAt: '2023-01-01T00:00:00.000Z',
};

const mockOnSuccess = jest.fn();
const mockOnCancel = jest.fn();

describe('CompanyForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Create Mode', () => {
    it('renders create form correctly', () => {
      render(<CompanyForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

      expect(screen.getByText('Add New Company')).toBeInTheDocument();
      expect(screen.getByLabelText(/company name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/website/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/ad spend/i)).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /create company/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /cancel/i })
      ).toBeInTheDocument();
    });

    it('validates required fields', async () => {
      const user = userEvent.setup();
      render(<CompanyForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

      const submitButton = screen.getByRole('button', {
        name: /create company/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText('Company name is required')
        ).toBeInTheDocument();
        expect(screen.getByText('Start date is required')).toBeInTheDocument();
        expect(
          screen.getByText('Phone number is required')
        ).toBeInTheDocument();
        expect(screen.getByText('Email is required')).toBeInTheDocument();
        expect(screen.getByText('Website is required')).toBeInTheDocument();
        expect(screen.getByText('Ad spend is required')).toBeInTheDocument();
      });
    });

    it('validates email format', async () => {
      const user = userEvent.setup();
      render(<CompanyForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'invalid-email');

      const submitButton = screen.getByRole('button', {
        name: /create company/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText('Please enter a valid email address')
        ).toBeInTheDocument();
      });
    });

    it('validates website URL format', async () => {
      const user = userEvent.setup();
      render(<CompanyForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

      const websiteInput = screen.getByLabelText(/website/i);
      await user.type(websiteInput, 'invalid-url');

      const submitButton = screen.getByRole('button', {
        name: /create company/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(
            'Please enter a valid website URL (include http:// or https://)'
          )
        ).toBeInTheDocument();
      });
    });

    it('validates phone number format', async () => {
      const user = userEvent.setup();
      render(<CompanyForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

      const phoneInput = screen.getByLabelText(/phone number/i);
      await user.type(phoneInput, '123');

      const submitButton = screen.getByRole('button', {
        name: /create company/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText('Please enter a valid phone number')
        ).toBeInTheDocument();
      });
    });

    it('validates ad spend is a positive number', async () => {
      const user = userEvent.setup();
      render(<CompanyForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

      const adSpendInput = screen.getByLabelText(/ad spend/i);
      await user.type(adSpendInput, '-100');

      const submitButton = screen.getByRole('button', {
        name: /create company/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText('Ad spend must be a valid positive number')
        ).toBeInTheDocument();
      });
    });

    it('prevents future start dates', async () => {
      const user = userEvent.setup();
      render(<CompanyForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowString = tomorrow.toISOString().split('T')[0];

      const startDateInput = screen.getByLabelText(/start date/i);
      await user.type(startDateInput, tomorrowString);

      const submitButton = screen.getByRole('button', {
        name: /create company/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText('Start date cannot be in the future')
        ).toBeInTheDocument();
      });
    });

    it('submits valid form data', async () => {
      const user = userEvent.setup();
      mockCompanyService.createCompany.mockResolvedValue({
        success: true,
        data: mockCompany,
      });

      render(<CompanyForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

      // Fill out the form
      await user.type(screen.getByLabelText(/company name/i), 'Test Company');
      await user.type(screen.getByLabelText(/start date/i), '2023-01-01');
      await user.type(screen.getByLabelText(/phone number/i), '+1234567890');
      await user.type(screen.getByLabelText(/email/i), 'test@company.com');
      await user.type(
        screen.getByLabelText(/website/i),
        'https://testcompany.com'
      );
      await user.type(screen.getByLabelText(/ad spend/i), '5000');

      const submitButton = screen.getByRole('button', {
        name: /create company/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockCompanyService.createCompany).toHaveBeenCalledWith({
          name: 'Test Company',
          startDate: '2023-01-01',
          phoneNumber: '+1234567890',
          email: 'test@company.com',
          website: 'https://testcompany.com',
          adSpend: 5000,
        });
        expect(mockOnSuccess).toHaveBeenCalledWith(mockCompany);
      });
    });

    it('handles API errors', async () => {
      const user = userEvent.setup();
      mockCompanyService.createCompany.mockResolvedValue({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Company name already exists',
        },
      });

      render(<CompanyForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

      // Fill out the form with valid data
      await user.type(screen.getByLabelText(/company name/i), 'Test Company');
      await user.type(screen.getByLabelText(/start date/i), '2023-01-01');
      await user.type(screen.getByLabelText(/phone number/i), '+1234567890');
      await user.type(screen.getByLabelText(/email/i), 'test@company.com');
      await user.type(
        screen.getByLabelText(/website/i),
        'https://testcompany.com'
      );
      await user.type(screen.getByLabelText(/ad spend/i), '5000');

      const submitButton = screen.getByRole('button', {
        name: /create company/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText('Company name already exists')
        ).toBeInTheDocument();
      });
    });

    it('calls onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<CompanyForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('Edit Mode', () => {
    it('renders edit form with pre-filled data', () => {
      render(
        <CompanyForm
          company={mockCompany}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Edit Company')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test Company')).toBeInTheDocument();
      expect(screen.getByDisplayValue('2023-01-01')).toBeInTheDocument();
      expect(screen.getByDisplayValue('+1234567890')).toBeInTheDocument();
      expect(screen.getByDisplayValue('test@company.com')).toBeInTheDocument();
      expect(
        screen.getByDisplayValue('https://testcompany.com')
      ).toBeInTheDocument();
      expect(screen.getByDisplayValue('5000')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /update company/i })
      ).toBeInTheDocument();
    });

    it('submits updated data', async () => {
      const user = userEvent.setup();
      mockCompanyService.updateCompany.mockResolvedValue({
        success: true,
        data: { ...mockCompany, name: 'Updated Company' },
      });

      render(
        <CompanyForm
          company={mockCompany}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      const nameInput = screen.getByDisplayValue('Test Company');
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Company');

      const submitButton = screen.getByRole('button', {
        name: /update company/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockCompanyService.updateCompany).toHaveBeenCalledWith('1', {
          name: 'Updated Company',
          startDate: '2023-01-01',
          phoneNumber: '+1234567890',
          email: 'test@company.com',
          website: 'https://testcompany.com',
          adSpend: 5000,
        });
      });
    });
  });

  describe('Form Interaction', () => {
    it('clears field errors when user starts typing', async () => {
      const user = userEvent.setup();
      render(<CompanyForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

      // Trigger validation error
      const submitButton = screen.getByRole('button', {
        name: /create company/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText('Company name is required')
        ).toBeInTheDocument();
      });

      // Start typing in the field
      const nameInput = screen.getByLabelText(/company name/i);
      await user.type(nameInput, 'T');

      // Error should be cleared
      expect(
        screen.queryByText('Company name is required')
      ).not.toBeInTheDocument();
    });

    it('disables form during submission', async () => {
      const user = userEvent.setup();
      // Mock a slow API response
      mockCompanyService.createCompany.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () => resolve({ success: true, data: mockCompany }),
              1000
            )
          )
      );

      render(<CompanyForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

      // Fill out the form
      await user.type(screen.getByLabelText(/company name/i), 'Test Company');
      await user.type(screen.getByLabelText(/start date/i), '2023-01-01');
      await user.type(screen.getByLabelText(/phone number/i), '+1234567890');
      await user.type(screen.getByLabelText(/email/i), 'test@company.com');
      await user.type(
        screen.getByLabelText(/website/i),
        'https://testcompany.com'
      );
      await user.type(screen.getByLabelText(/ad spend/i), '5000');

      const submitButton = screen.getByRole('button', {
        name: /create company/i,
      });
      await user.click(submitButton);

      // Check that button is disabled and shows loading state
      expect(screen.getByRole('button', { name: /saving.../i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
    });
  });
});
