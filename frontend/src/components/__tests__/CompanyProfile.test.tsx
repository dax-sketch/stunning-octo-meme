import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { CompanyProfile } from '../CompanyProfile';
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
  lastPaymentDate: '2023-12-01T00:00:00.000Z',
  lastPaymentAmount: 1000,
  lastMeetingDate: '2023-11-15T00:00:00.000Z',
  lastMeetingAttendees: ['John Doe', 'Jane Smith'],
  createdBy: 'user1',
  createdAt: '2023-01-01T00:00:00.000Z',
  updatedAt: '2023-01-01T00:00:00.000Z',
};

const mockOnBack = jest.fn();
const mockOnEdit = jest.fn();

describe('CompanyProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    mockCompanyService.getCompany.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(
      <CompanyProfile companyId="1" onBack={mockOnBack} onEdit={mockOnEdit} />
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders company profile after loading', async () => {
    mockCompanyService.getCompany.mockResolvedValue({
      success: true,
      data: mockCompany,
    });

    render(
      <CompanyProfile companyId="1" onBack={mockOnBack} onEdit={mockOnEdit} />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Company')).toBeInTheDocument();
      expect(screen.getByText('Tier 1 - High Ad Spend')).toBeInTheDocument();
      expect(screen.getByText('+1234567890')).toBeInTheDocument();
      expect(screen.getByText('test@company.com')).toBeInTheDocument();
      expect(screen.getByText('$5,000')).toBeInTheDocument();
    });
  });

  it('handles API errors', async () => {
    mockCompanyService.getCompany.mockResolvedValue({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Company not found',
      },
    });

    render(
      <CompanyProfile companyId="1" onBack={mockOnBack} onEdit={mockOnEdit} />
    );

    await waitFor(() => {
      expect(screen.getByText('Company not found')).toBeInTheDocument();
    });
  });

  it('calls onBack when back button is clicked', async () => {
    const user = userEvent.setup();
    mockCompanyService.getCompany.mockResolvedValue({
      success: true,
      data: mockCompany,
    });

    render(
      <CompanyProfile companyId="1" onBack={mockOnBack} onEdit={mockOnEdit} />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Company')).toBeInTheDocument();
    });

    const backButton = screen.getByRole('button', {
      name: /back to companies/i,
    });
    await user.click(backButton);

    expect(mockOnBack).toHaveBeenCalled();
  });

  it('calls onEdit when edit button is clicked', async () => {
    const user = userEvent.setup();
    mockCompanyService.getCompany.mockResolvedValue({
      success: true,
      data: mockCompany,
    });

    render(
      <CompanyProfile companyId="1" onBack={mockOnBack} onEdit={mockOnEdit} />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Company')).toBeInTheDocument();
    });

    const editButton = screen.getByRole('button', { name: /edit company/i });
    await user.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledWith(mockCompany);
  });

  it('displays company age correctly', async () => {
    // Mock current date to be 2023-07-01 for consistent testing
    const mockDate = new Date('2023-07-01T00:00:00.000Z');
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

    mockCompanyService.getCompany.mockResolvedValue({
      success: true,
      data: mockCompany,
    });

    render(
      <CompanyProfile companyId="1" onBack={mockOnBack} onEdit={mockOnEdit} />
    );

    await waitFor(() => {
      // Company started on 2023-01-01, so by 2023-07-01 it should be 6 months old
      expect(screen.getByText(/6 months old/)).toBeInTheDocument();
    });

    jest.restoreAllMocks();
  });

  it('formats dates correctly', async () => {
    mockCompanyService.getCompany.mockResolvedValue({
      success: true,
      data: mockCompany,
    });

    render(
      <CompanyProfile companyId="1" onBack={mockOnBack} onEdit={mockOnEdit} />
    );

    await waitFor(() => {
      expect(screen.getByText(/Started January 1, 2023/)).toBeInTheDocument();
    });
  });

  it('makes website clickable', async () => {
    mockCompanyService.getCompany.mockResolvedValue({
      success: true,
      data: mockCompany,
    });

    render(
      <CompanyProfile companyId="1" onBack={mockOnBack} onEdit={mockOnEdit} />
    );

    await waitFor(() => {
      const websiteLink = screen.getByRole('link', {
        name: 'https://testcompany.com',
      });
      expect(websiteLink).toHaveAttribute('href', 'https://testcompany.com');
      expect(websiteLink).toHaveAttribute('target', '_blank');
      expect(websiteLink).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  it('switches between tabs', async () => {
    const user = userEvent.setup();
    mockCompanyService.getCompany.mockResolvedValue({
      success: true,
      data: mockCompany,
    });

    render(
      <CompanyProfile companyId="1" onBack={mockOnBack} onEdit={mockOnEdit} />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Company')).toBeInTheDocument();
    });

    // Check default tab (Overview)
    expect(screen.getByText('Company Information')).toBeInTheDocument();

    // Switch to Payment History tab
    const paymentTab = screen.getByRole('tab', { name: /payment history/i });
    await user.click(paymentTab);

    expect(screen.getByText('Payment History')).toBeInTheDocument();
    expect(
      screen.getByText(/Last Payment: December 1, 2023/)
    ).toBeInTheDocument();

    // Switch to Meeting History tab
    const meetingTab = screen.getByRole('tab', { name: /meeting history/i });
    await user.click(meetingTab);

    expect(screen.getByText('Meeting History')).toBeInTheDocument();
    expect(
      screen.getByText(/Last Meeting: November 15, 2023/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Attendees: John Doe, Jane Smith/)
    ).toBeInTheDocument();

    // Switch to Notes tab
    const notesTab = screen.getByRole('tab', { name: /notes/i });
    await user.click(notesTab);

    expect(screen.getByText('Company Notes')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Notes functionality will be implemented in the next task.'
      )
    ).toBeInTheDocument();
  });

  it('displays tier chip with correct styling', async () => {
    mockCompanyService.getCompany.mockResolvedValue({
      success: true,
      data: mockCompany,
    });

    render(
      <CompanyProfile companyId="1" onBack={mockOnBack} onEdit={mockOnEdit} />
    );

    await waitFor(() => {
      const tierChip = screen.getByText('Tier 1 - High Ad Spend');
      expect(tierChip).toHaveStyle({ backgroundColor: '#4caf50' });
    });
  });

  it('displays financial information correctly', async () => {
    mockCompanyService.getCompany.mockResolvedValue({
      success: true,
      data: mockCompany,
    });

    render(
      <CompanyProfile companyId="1" onBack={mockOnBack} onEdit={mockOnEdit} />
    );

    await waitFor(() => {
      expect(screen.getByText('$5,000')).toBeInTheDocument(); // Ad spend
      expect(screen.getByText('$1,000')).toBeInTheDocument(); // Last payment amount
    });
  });

  it('handles company without payment history', async () => {
    const companyWithoutPayment = {
      ...mockCompany,
      lastPaymentDate: undefined,
      lastPaymentAmount: undefined,
    };

    mockCompanyService.getCompany.mockResolvedValue({
      success: true,
      data: companyWithoutPayment,
    });

    render(
      <CompanyProfile companyId="1" onBack={mockOnBack} onEdit={mockOnEdit} />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Company')).toBeInTheDocument();
    });

    // Switch to Payment History tab
    const user = userEvent.setup();
    const paymentTab = screen.getByRole('tab', { name: /payment history/i });
    await user.click(paymentTab);

    expect(
      screen.getByText('No payment history available.')
    ).toBeInTheDocument();
  });

  it('handles company without meeting history', async () => {
    const companyWithoutMeeting = {
      ...mockCompany,
      lastMeetingDate: undefined,
      lastMeetingAttendees: undefined,
    };

    mockCompanyService.getCompany.mockResolvedValue({
      success: true,
      data: companyWithoutMeeting,
    });

    render(
      <CompanyProfile companyId="1" onBack={mockOnBack} onEdit={mockOnEdit} />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Company')).toBeInTheDocument();
    });

    // Switch to Meeting History tab
    const user = userEvent.setup();
    const meetingTab = screen.getByRole('tab', { name: /meeting history/i });
    await user.click(meetingTab);

    expect(
      screen.getByText('No meeting history available.')
    ).toBeInTheDocument();
  });

  it('displays all company information in overview tab', async () => {
    mockCompanyService.getCompany.mockResolvedValue({
      success: true,
      data: mockCompany,
    });

    render(
      <CompanyProfile companyId="1" onBack={mockOnBack} onEdit={mockOnEdit} />
    );

    await waitFor(() => {
      expect(screen.getByText('Company Information')).toBeInTheDocument();
      expect(screen.getByText('Financial Information')).toBeInTheDocument();
      expect(screen.getByText('Test Company')).toBeInTheDocument();
      expect(screen.getByText('January 1, 2023')).toBeInTheDocument();
    });
  });

  it('reloads company data when companyId changes', async () => {
    mockCompanyService.getCompany.mockResolvedValue({
      success: true,
      data: mockCompany,
    });

    const { rerender } = render(
      <CompanyProfile companyId="1" onBack={mockOnBack} onEdit={mockOnEdit} />
    );

    await waitFor(() => {
      expect(mockCompanyService.getCompany).toHaveBeenCalledWith('1');
    });

    rerender(
      <CompanyProfile companyId="2" onBack={mockOnBack} onEdit={mockOnEdit} />
    );

    await waitFor(() => {
      expect(mockCompanyService.getCompany).toHaveBeenCalledWith('2');
    });
  });
});
