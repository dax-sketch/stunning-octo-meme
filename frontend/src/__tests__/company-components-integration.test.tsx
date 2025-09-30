import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { CompaniesPage } from '../pages/CompaniesPage';
import { companyService } from '../services/companyService';

// Mock the company service
jest.mock('../services/companyService');
const mockCompanyService = companyService as jest.Mocked<typeof companyService>;

const mockCompanies = [
  {
    id: '1',
    name: 'Test Company 1',
    startDate: '2023-01-01T00:00:00.000Z',
    phoneNumber: '+1234567890',
    email: 'test1@company.com',
    website: 'https://test1.com',
    tier: 'TIER_1' as const,
    adSpend: 5000,
    createdBy: 'user1',
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z',
  },
  {
    id: '2',
    name: 'Test Company 2',
    startDate: '2023-02-01T00:00:00.000Z',
    phoneNumber: '+1234567891',
    email: 'test2@company.com',
    website: 'https://test2.com',
    tier: 'TIER_2' as const,
    adSpend: 3000,
    createdBy: 'user1',
    createdAt: '2023-02-01T00:00:00.000Z',
    updatedAt: '2023-02-01T00:00:00.000Z',
  },
];

describe('Company Components Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCompanyService.getCompanies.mockResolvedValue({
      success: true,
      data: mockCompanies,
    });
  });

  it('renders companies page with list view by default', async () => {
    render(<CompaniesPage />);

    await waitFor(() => {
      expect(screen.getByText('Companies (2)')).toBeInTheDocument();
      expect(screen.getByText('Test Company 1')).toBeInTheDocument();
      expect(screen.getByText('Test Company 2')).toBeInTheDocument();
    });
  });

  it('switches to form view when add company is clicked', async () => {
    const user = userEvent.setup();
    render(<CompaniesPage />);

    await waitFor(() => {
      expect(screen.getByText('Companies (2)')).toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', { name: /add company/i });
    await user.click(addButton);

    expect(screen.getByText('Add New Company')).toBeInTheDocument();
    expect(screen.getByLabelText(/company name/i)).toBeInTheDocument();
  });

  it('switches to profile view when view details is clicked', async () => {
    const user = userEvent.setup();
    mockCompanyService.getCompany.mockResolvedValue({
      success: true,
      data: mockCompanies[0],
    });

    render(<CompaniesPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Company 1')).toBeInTheDocument();
    });

    const viewButtons = screen.getAllByRole('button', {
      name: /view details/i,
    });
    await user.click(viewButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Test Company 1')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /back to companies/i })
      ).toBeInTheDocument();
    });
  });

  it('switches to edit form when edit is clicked', async () => {
    const user = userEvent.setup();
    render(<CompaniesPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Company 1')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByRole('button', {
      name: /edit company/i,
    });
    await user.click(editButtons[0]);

    expect(screen.getByText('Edit Company')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Company 1')).toBeInTheDocument();
  });

  it('returns to list view after form submission', async () => {
    const user = userEvent.setup();
    mockCompanyService.createCompany.mockResolvedValue({
      success: true,
      data: {
        ...mockCompanies[0],
        id: '3',
        name: 'New Company',
      },
    });

    render(<CompaniesPage />);

    await waitFor(() => {
      expect(screen.getByText('Companies (2)')).toBeInTheDocument();
    });

    // Go to add form
    const addButton = screen.getByRole('button', { name: /add company/i });
    await user.click(addButton);

    // Fill out form
    await user.type(screen.getByLabelText(/company name/i), 'New Company');
    await user.type(screen.getByLabelText(/start date/i), '2023-01-01');
    await user.type(screen.getByLabelText(/phone number/i), '+1234567890');
    await user.type(screen.getByLabelText(/email/i), 'new@company.com');
    await user.type(screen.getByLabelText(/website/i), 'https://new.com');
    await user.type(screen.getByLabelText(/ad spend/i), '5000');

    // Submit form
    const submitButton = screen.getByRole('button', {
      name: /create company/i,
    });
    await user.click(submitButton);

    // Should return to list view
    await waitFor(() => {
      expect(mockCompanyService.getCompanies).toHaveBeenCalledTimes(2); // Initial load + refresh
    });
  });

  it('returns to list view when form is cancelled', async () => {
    const user = userEvent.setup();
    render(<CompaniesPage />);

    await waitFor(() => {
      expect(screen.getByText('Companies (2)')).toBeInTheDocument();
    });

    // Go to add form
    const addButton = screen.getByRole('button', { name: /add company/i });
    await user.click(addButton);

    expect(screen.getByText('Add New Company')).toBeInTheDocument();

    // Cancel form
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    // Should return to list view
    expect(screen.getByText('Companies (2)')).toBeInTheDocument();
  });

  it('filters companies correctly', async () => {
    const user = userEvent.setup();
    render(<CompaniesPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Company 1')).toBeInTheDocument();
      expect(screen.getByText('Test Company 2')).toBeInTheDocument();
    });

    // Filter by Tier 1
    const tierFilter = screen.getByLabelText('Filter by Tier');
    await user.click(tierFilter);

    const tier1Option = screen.getByText('Tier 1 - High Ad Spend');
    await user.click(tier1Option);

    // Should only show Tier 1 companies
    expect(screen.getByText('Test Company 1')).toBeInTheDocument();
    expect(screen.queryByText('Test Company 2')).not.toBeInTheDocument();
  });

  it('searches companies correctly', async () => {
    const user = userEvent.setup();
    render(<CompaniesPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Company 1')).toBeInTheDocument();
      expect(screen.getByText('Test Company 2')).toBeInTheDocument();
    });

    // Search for specific company
    const searchInput = screen.getByPlaceholderText('Search companies...');
    await user.type(searchInput, 'Test Company 1');

    expect(screen.getByText('Test Company 1')).toBeInTheDocument();
    expect(screen.queryByText('Test Company 2')).not.toBeInTheDocument();
  });
});
