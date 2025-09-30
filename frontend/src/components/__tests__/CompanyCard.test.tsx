import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { CompanyCard } from '../CompanyCard';
import { Company } from '../../types/company';

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

const mockOnEdit = jest.fn();
const mockOnDelete = jest.fn();
const mockOnView = jest.fn();

describe('CompanyCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders company information correctly', () => {
    render(
      <CompanyCard
        company={mockCompany}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onView={mockOnView}
      />
    );

    expect(screen.getByText('Test Company')).toBeInTheDocument();
    expect(screen.getByText('Tier 1 - High Ad Spend')).toBeInTheDocument();
    expect(screen.getByText('+1234567890')).toBeInTheDocument();
    expect(screen.getByText('test@company.com')).toBeInTheDocument();
    expect(screen.getByText('$5,000')).toBeInTheDocument();
  });

  it('displays tier chip with correct color', () => {
    render(
      <CompanyCard
        company={mockCompany}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onView={mockOnView}
      />
    );

    const tierChip = screen.getByText('Tier 1 - High Ad Spend');
    expect(tierChip).toHaveStyle({ backgroundColor: '#4caf50' });
  });

  it('renders different tier colors correctly', () => {
    const tier2Company = { ...mockCompany, tier: 'TIER_2' as const };
    const { rerender } = render(
      <CompanyCard
        company={tier2Company}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onView={mockOnView}
      />
    );

    expect(screen.getByText('Tier 2 - New Companies')).toHaveStyle({
      backgroundColor: '#ff9800',
    });

    const tier3Company = { ...mockCompany, tier: 'TIER_3' as const };
    rerender(
      <CompanyCard
        company={tier3Company}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onView={mockOnView}
      />
    );

    expect(screen.getByText('Tier 3 - Low Ad Spend')).toHaveStyle({
      backgroundColor: '#f44336',
    });
  });

  it('displays company age correctly', () => {
    // Mock current date to be 2023-07-01 for consistent testing
    const mockDate = new Date('2023-07-01T00:00:00.000Z');
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

    render(
      <CompanyCard
        company={mockCompany}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onView={mockOnView}
      />
    );

    // Company started on 2023-01-01, so by 2023-07-01 it should be 6 months old
    expect(screen.getByText(/6 months/)).toBeInTheDocument();

    jest.restoreAllMocks();
  });

  it('formats currency correctly', () => {
    render(
      <CompanyCard
        company={mockCompany}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onView={mockOnView}
      />
    );

    expect(screen.getByText('$5,000')).toBeInTheDocument();
    expect(screen.getByText('$1,000')).toBeInTheDocument();
  });

  it('displays payment and meeting history when available', () => {
    render(
      <CompanyCard
        company={mockCompany}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onView={mockOnView}
      />
    );

    expect(screen.getByText(/Last Payment:/)).toBeInTheDocument();
    expect(screen.getByText(/Dec 1, 2023/)).toBeInTheDocument();
    expect(screen.getByText(/Last Meeting:/)).toBeInTheDocument();
    expect(screen.getByText(/Nov 15, 2023/)).toBeInTheDocument();
    expect(screen.getByText(/John Doe, Jane Smith/)).toBeInTheDocument();
  });

  it('hides payment and meeting history when not available', () => {
    const companyWithoutHistory = {
      ...mockCompany,
      lastPaymentDate: undefined,
      lastPaymentAmount: undefined,
      lastMeetingDate: undefined,
      lastMeetingAttendees: undefined,
    };

    render(
      <CompanyCard
        company={companyWithoutHistory}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onView={mockOnView}
      />
    );

    expect(screen.queryByText(/Last Payment:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Last Meeting:/)).not.toBeInTheDocument();
  });

  it('makes website clickable', () => {
    render(
      <CompanyCard
        company={mockCompany}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onView={mockOnView}
      />
    );

    const websiteLink = screen.getByRole('link', {
      name: 'https://testcompany.com',
    });
    expect(websiteLink).toHaveAttribute('href', 'https://testcompany.com');
    expect(websiteLink).toHaveAttribute('target', '_blank');
    expect(websiteLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('calls onView when View Details button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <CompanyCard
        company={mockCompany}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onView={mockOnView}
      />
    );

    const viewButton = screen.getByRole('button', { name: /view details/i });
    await user.click(viewButton);

    expect(mockOnView).toHaveBeenCalledWith(mockCompany);
  });

  it('calls onEdit when edit icon is clicked', async () => {
    const user = userEvent.setup();
    render(
      <CompanyCard
        company={mockCompany}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onView={mockOnView}
      />
    );

    const editButton = screen.getByRole('button', { name: /edit company/i });
    await user.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledWith(mockCompany);
  });

  it('calls onDelete when delete icon is clicked', async () => {
    const user = userEvent.setup();
    render(
      <CompanyCard
        company={mockCompany}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onView={mockOnView}
      />
    );

    const deleteButton = screen.getByRole('button', {
      name: /delete company/i,
    });
    await user.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledWith(mockCompany);
  });

  it('has hover effects', () => {
    render(
      <CompanyCard
        company={mockCompany}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onView={mockOnView}
      />
    );

    const card = screen.getByText('Test Company').closest('.MuiCard-root');
    expect(card).toHaveStyle({
      transition: 'transform 0.2s, box-shadow 0.2s',
    });
  });

  it('handles long text gracefully', () => {
    const companyWithLongText = {
      ...mockCompany,
      name: 'Very Long Company Name That Should Not Break The Layout',
      email: 'very.long.email.address@very-long-domain-name.com',
      website: 'https://very-long-website-url-that-should-wrap-properly.com',
    };

    render(
      <CompanyCard
        company={companyWithLongText}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onView={mockOnView}
      />
    );

    expect(
      screen.getByText(
        'Very Long Company Name That Should Not Break The Layout'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText('very.long.email.address@very-long-domain-name.com')
    ).toBeInTheDocument();
  });

  it('displays correct date format', () => {
    render(
      <CompanyCard
        company={mockCompany}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onView={mockOnView}
      />
    );

    // Check that dates are formatted as "Jan 1, 2023" format
    expect(screen.getByText(/Jan 1, 2023/)).toBeInTheDocument();
  });
});
