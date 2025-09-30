import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { CompanyList } from '../CompanyList';
import { companyService } from '../../services/companyService';
import { Company } from '../../types/company';

// Mock the company service
jest.mock('../../services/companyService');
const mockCompanyService = companyService as jest.Mocked<typeof companyService>;

const mockCompanies: Company[] = [
  {
    id: '1',
    name: 'Alpha Company',
    startDate: '2023-01-01T00:00:00.000Z',
    phoneNumber: '+1234567890',
    email: 'alpha@company.com',
    website: 'https://alpha.com',
    tier: 'TIER_1',
    adSpend: 10000,
    createdBy: 'user1',
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z',
  },
  {
    id: '2',
    name: 'Beta Company',
    startDate: '2023-06-01T00:00:00.000Z',
    phoneNumber: '+1234567891',
    email: 'beta@company.com',
    website: 'https://beta.com',
    tier: 'TIER_2',
    adSpend: 3000,
    createdBy: 'user1',
    createdAt: '2023-06-01T00:00:00.000Z',
    updatedAt: '2023-06-01T00:00:00.000Z',
  },
  {
    id: '3',
    name: 'Gamma Company',
    startDate: '2022-01-01T00:00:00.000Z',
    phoneNumber: '+1234567892',
    email: 'gamma@company.com',
    website: 'https://gamma.com',
    tier: 'TIER_3',
    adSpend: 500,
    createdBy: 'user1',
    createdAt: '2022-01-01T00:00:00.000Z',
    updatedAt: '2022-01-01T00:00:00.000Z',
  },
];

const mockOnAddCompany = jest.fn();
const mockOnEditCompany = jest.fn();
const mockOnViewCompany = jest.fn();

describe('CompanyList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    mockCompanyService.getCompanies.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(
      <CompanyList
        onAddCompany={mockOnAddCompany}
        onEditCompany={mockOnEditCompany}
        onViewCompany={mockOnViewCompany}
      />
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders companies after loading', async () => {
    mockCompanyService.getCompanies.mockResolvedValue({
      success: true,
      data: mockCompanies,
    });

    render(
      <CompanyList
        onAddCompany={mockOnAddCompany}
        onEditCompany={mockOnEditCompany}
        onViewCompany={mockOnViewCompany}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Companies (3)')).toBeInTheDocument();
      expect(screen.getByText('Alpha Company')).toBeInTheDocument();
      expect(screen.getByText('Beta Company')).toBeInTheDocument();
      expect(screen.getByText('Gamma Company')).toBeInTheDocument();
    });
  });

  it('displays company statistics', async () => {
    mockCompanyService.getCompanies.mockResolvedValue({
      success: true,
      data: mockCompanies,
    });

    render(
      <CompanyList
        onAddCompany={mockOnAddCompany}
        onEditCompany={mockOnEditCompany}
        onViewCompany={mockOnViewCompany}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Tier 1: 1 companies')).toBeInTheDocument();
      expect(screen.getByText('Tier 2: 1 companies')).toBeInTheDocument();
      expect(screen.getByText('Tier 3: 1 companies')).toBeInTheDocument();
    });
  });

  it('handles API errors', async () => {
    mockCompanyService.getCompanies.mockResolvedValue({
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: 'Failed to load companies',
      },
    });

    render(
      <CompanyList
        onAddCompany={mockOnAddCompany}
        onEditCompany={mockOnEditCompany}
        onViewCompany={mockOnViewCompany}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to load companies')).toBeInTheDocument();
    });
  });

  it('filters companies by search term', async () => {
    const user = userEvent.setup();
    mockCompanyService.getCompanies.mockResolvedValue({
      success: true,
      data: mockCompanies,
    });

    render(
      <CompanyList
        onAddCompany={mockOnAddCompany}
        onEditCompany={mockOnEditCompany}
        onViewCompany={mockOnViewCompany}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Alpha Company')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search companies...');
    await user.type(searchInput, 'Alpha');

    expect(screen.getByText('Alpha Company')).toBeInTheDocument();
    expect(screen.queryByText('Beta Company')).not.toBeInTheDocument();
    expect(screen.queryByText('Gamma Company')).not.toBeInTheDocument();
  });

  it('filters companies by tier', async () => {
    const user = userEvent.setup();
    mockCompanyService.getCompanies.mockResolvedValue({
      success: true,
      data: mockCompanies,
    });

    render(
      <CompanyList
        onAddCompany={mockOnAddCompany}
        onEditCompany={mockOnEditCompany}
        onViewCompany={mockOnViewCompany}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Alpha Company')).toBeInTheDocument();
    });

    const tierFilter = screen.getByLabelText('Filter by Tier');
    await user.click(tierFilter);

    const tier1Option = screen.getByText('Tier 1 - High Ad Spend');
    await user.click(tier1Option);

    expect(screen.getByText('Alpha Company')).toBeInTheDocument();
    expect(screen.queryByText('Beta Company')).not.toBeInTheDocument();
    expect(screen.queryByText('Gamma Company')).not.toBeInTheDocument();
  });

  it('searches across multiple fields', async () => {
    const user = userEvent.setup();
    mockCompanyService.getCompanies.mockResolvedValue({
      success: true,
      data: mockCompanies,
    });

    render(
      <CompanyList
        onAddCompany={mockOnAddCompany}
        onEditCompany={mockOnEditCompany}
        onViewCompany={mockOnViewCompany}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Alpha Company')).toBeInTheDocument();
    });

    // Search by email
    const searchInput = screen.getByPlaceholderText('Search companies...');
    await user.type(searchInput, 'beta@company.com');

    expect(screen.queryByText('Alpha Company')).not.toBeInTheDocument();
    expect(screen.getByText('Beta Company')).toBeInTheDocument();
    expect(screen.queryByText('Gamma Company')).not.toBeInTheDocument();
  });

  it('calls onAddCompany when add button is clicked', async () => {
    const user = userEvent.setup();
    mockCompanyService.getCompanies.mockResolvedValue({
      success: true,
      data: mockCompanies,
    });

    render(
      <CompanyList
        onAddCompany={mockOnAddCompany}
        onEditCompany={mockOnEditCompany}
        onViewCompany={mockOnViewCompany}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Companies (3)')).toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', { name: /add company/i });
    await user.click(addButton);

    expect(mockOnAddCompany).toHaveBeenCalled();
  });

  it('shows empty state when no companies exist', async () => {
    mockCompanyService.getCompanies.mockResolvedValue({
      success: true,
      data: [],
    });

    render(
      <CompanyList
        onAddCompany={mockOnAddCompany}
        onEditCompany={mockOnEditCompany}
        onViewCompany={mockOnViewCompany}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('No companies found')).toBeInTheDocument();
      expect(
        screen.getByText('Get started by adding your first company')
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /add first company/i })
      ).toBeInTheDocument();
    });
  });

  it('shows filtered empty state when no companies match filters', async () => {
    const user = userEvent.setup();
    mockCompanyService.getCompanies.mockResolvedValue({
      success: true,
      data: mockCompanies,
    });

    render(
      <CompanyList
        onAddCompany={mockOnAddCompany}
        onEditCompany={mockOnEditCompany}
        onViewCompany={mockOnViewCompany}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Alpha Company')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search companies...');
    await user.type(searchInput, 'NonExistentCompany');

    expect(
      screen.getByText('No companies match your filters')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Try adjusting your search or filter criteria')
    ).toBeInTheDocument();
  });

  it('handles company deletion', async () => {
    const user = userEvent.setup();
    mockCompanyService.getCompanies.mockResolvedValue({
      success: true,
      data: mockCompanies,
    });
    mockCompanyService.deleteCompany.mockResolvedValue({
      success: true,
    });

    render(
      <CompanyList
        onAddCompany={mockOnAddCompany}
        onEditCompany={mockOnEditCompany}
        onViewCompany={mockOnViewCompany}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Alpha Company')).toBeInTheDocument();
    });

    // Click delete button on first company
    const deleteButtons = screen.getAllByRole('button', {
      name: /delete company/i,
    });
    await user.click(deleteButtons[0]);

    // Confirm deletion in dialog
    expect(
      screen.getByText(/Are you sure you want to delete/)
    ).toBeInTheDocument();
    const confirmButton = screen.getByRole('button', { name: /delete$/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockCompanyService.deleteCompany).toHaveBeenCalledWith('1');
    });
  });

  it('handles delete cancellation', async () => {
    const user = userEvent.setup();
    mockCompanyService.getCompanies.mockResolvedValue({
      success: true,
      data: mockCompanies,
    });

    render(
      <CompanyList
        onAddCompany={mockOnAddCompany}
        onEditCompany={mockOnEditCompany}
        onViewCompany={mockOnViewCompany}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Alpha Company')).toBeInTheDocument();
    });

    // Click delete button
    const deleteButtons = screen.getAllByRole('button', {
      name: /delete company/i,
    });
    await user.click(deleteButtons[0]);

    // Cancel deletion
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockCompanyService.deleteCompany).not.toHaveBeenCalled();
    expect(
      screen.queryByText(/Are you sure you want to delete/)
    ).not.toBeInTheDocument();
  });

  it('refreshes data when refreshTrigger changes', async () => {
    mockCompanyService.getCompanies.mockResolvedValue({
      success: true,
      data: mockCompanies,
    });

    const { rerender } = render(
      <CompanyList
        onAddCompany={mockOnAddCompany}
        onEditCompany={mockOnEditCompany}
        onViewCompany={mockOnViewCompany}
        refreshTrigger={1}
      />
    );

    await waitFor(() => {
      expect(mockCompanyService.getCompanies).toHaveBeenCalledTimes(1);
    });

    rerender(
      <CompanyList
        onAddCompany={mockOnAddCompany}
        onEditCompany={mockOnEditCompany}
        onViewCompany={mockOnViewCompany}
        refreshTrigger={2}
      />
    );

    await waitFor(() => {
      expect(mockCompanyService.getCompanies).toHaveBeenCalledTimes(2);
    });
  });

  it('sorts companies by creation date (newest first)', async () => {
    mockCompanyService.getCompanies.mockResolvedValue({
      success: true,
      data: mockCompanies,
    });

    render(
      <CompanyList
        onAddCompany={mockOnAddCompany}
        onEditCompany={mockOnEditCompany}
        onViewCompany={mockOnViewCompany}
      />
    );

    await waitFor(() => {
      const companyCards = screen.getAllByText(/Company$/);
      // Beta Company (2023-06-01) should come before Alpha Company (2023-01-01)
      // which should come before Gamma Company (2022-01-01)
      expect(companyCards[0]).toHaveTextContent('Beta Company');
      expect(companyCards[1]).toHaveTextContent('Alpha Company');
      expect(companyCards[2]).toHaveTextContent('Gamma Company');
    });
  });
});
