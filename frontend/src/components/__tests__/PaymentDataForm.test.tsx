import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PaymentDataForm } from '../PaymentDataForm';
import { companyService } from '../../services/companyService';
import { Company } from '../../types/company';

// Mock the company service
jest.mock('../../services/companyService');
const mockedCompanyService = companyService as jest.Mocked<
  typeof companyService
>;

const mockCompany: Company = {
  id: 'company123',
  name: 'Test Company',
  startDate: '2023-01-01T00:00:00.000Z',
  phoneNumber: '+1234567890',
  email: 'test@company.com',
  website: 'https://testcompany.com',
  tier: 'TIER_2',
  adSpend: 1000,
  lastPaymentDate: '2024-01-01T00:00:00.000Z',
  lastPaymentAmount: 5000,
  createdBy: 'user123',
  createdAt: '2023-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const mockProps = {
  open: true,
  onClose: jest.fn(),
  company: mockCompany,
  onSuccess: jest.fn(),
};

describe('PaymentDataForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders payment data form with existing data', () => {
    render(<PaymentDataForm {...mockProps} />);

    expect(screen.getByText('Update Payment Data')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2024-01-01')).toBeInTheDocument();
    expect(screen.getByDisplayValue('5000')).toBeInTheDocument();
  });

  it('renders form with empty data for company without payment history', () => {
    const companyWithoutPayment = {
      ...mockCompany,
      lastPaymentDate: undefined,
      lastPaymentAmount: undefined,
    };

    render(<PaymentDataForm {...mockProps} company={companyWithoutPayment} />);

    expect(screen.getByLabelText(/payment date/i)).toHaveValue('');
    expect(screen.getByLabelText(/payment amount/i)).toHaveValue(0);
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    render(<PaymentDataForm {...mockProps} />);

    // Clear the form
    const dateInput = screen.getByLabelText(/payment date/i);
    const amountInput = screen.getByLabelText(/payment amount/i);

    await user.clear(dateInput);
    await user.clear(amountInput);

    const submitButton = screen.getByRole('button', {
      name: /update payment data/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Please fill in all required fields')
      ).toBeInTheDocument();
    });
  });

  it('validates positive payment amount', async () => {
    const user = userEvent.setup();
    render(<PaymentDataForm {...mockProps} />);

    const amountInput = screen.getByLabelText(/payment amount/i);
    await user.clear(amountInput);
    await user.type(amountInput, '-100');

    const submitButton = screen.getByRole('button', {
      name: /update payment data/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Payment amount must be greater than 0')
      ).toBeInTheDocument();
    });
  });

  it('submits form successfully', async () => {
    const user = userEvent.setup();
    const mockResponse = {
      success: true,
      data: {
        ...mockCompany,
        lastPaymentDate: '2024-02-01T00:00:00.000Z',
        lastPaymentAmount: 6000,
      },
    };

    mockedCompanyService.updatePaymentData.mockResolvedValue(mockResponse);

    render(<PaymentDataForm {...mockProps} />);

    const dateInput = screen.getByLabelText(/payment date/i);
    const amountInput = screen.getByLabelText(/payment amount/i);

    await user.clear(dateInput);
    await user.type(dateInput, '2024-02-01');
    await user.clear(amountInput);
    await user.type(amountInput, '6000');

    const submitButton = screen.getByRole('button', {
      name: /update payment data/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockedCompanyService.updatePaymentData).toHaveBeenCalledWith(
        'company123',
        {
          lastPaymentDate: '2024-02-01',
          lastPaymentAmount: 6000,
        }
      );
      expect(mockProps.onSuccess).toHaveBeenCalledWith(mockResponse.data);
      expect(mockProps.onClose).toHaveBeenCalled();
    });
  });

  it('handles API error', async () => {
    const user = userEvent.setup();
    const mockErrorResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid payment data',
      },
    };

    mockedCompanyService.updatePaymentData.mockResolvedValue(mockErrorResponse);

    render(<PaymentDataForm {...mockProps} />);

    const submitButton = screen.getByRole('button', {
      name: /update payment data/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid payment data')).toBeInTheDocument();
    });
  });

  it('handles network error', async () => {
    const user = userEvent.setup();
    mockedCompanyService.updatePaymentData.mockRejectedValue(
      new Error('Network error')
    );

    render(<PaymentDataForm {...mockProps} />);

    const submitButton = screen.getByRole('button', {
      name: /update payment data/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('An unexpected error occurred')
      ).toBeInTheDocument();
    });
  });

  it('closes dialog on cancel', async () => {
    const user = userEvent.setup();
    render(<PaymentDataForm {...mockProps} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('disables form during submission', async () => {
    const user = userEvent.setup();
    mockedCompanyService.updatePaymentData.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 1000))
    );

    render(<PaymentDataForm {...mockProps} />);

    const submitButton = screen.getByRole('button', {
      name: /update payment data/i,
    });
    await user.click(submitButton);

    expect(screen.getByText('Updating...')).toBeInTheDocument();
    expect(screen.getByLabelText(/payment date/i)).toBeDisabled();
    expect(screen.getByLabelText(/payment amount/i)).toBeDisabled();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
  });

  it('does not render when closed', () => {
    render(<PaymentDataForm {...mockProps} open={false} />);
    expect(screen.queryByText('Update Payment Data')).not.toBeInTheDocument();
  });
});
