import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  CompanyForm,
  CompanyCard,
  CompanyList,
  CompanyProfile,
} from '../index';
import { Company } from '../../types/company';

// Mock the company service
jest.mock('../../services/companyService', () => ({
  companyService: {
    getCompanies: jest.fn().mockResolvedValue({ success: true, data: [] }),
    getCompany: jest.fn().mockResolvedValue({ success: true, data: null }),
    createCompany: jest.fn().mockResolvedValue({ success: true, data: {} }),
    updateCompany: jest.fn().mockResolvedValue({ success: true, data: {} }),
    deleteCompany: jest.fn().mockResolvedValue({ success: true }),
  },
}));

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

describe('Company Components Integration', () => {
  it('exports all company components correctly', () => {
    expect(CompanyForm).toBeDefined();
    expect(CompanyCard).toBeDefined();
    expect(CompanyList).toBeDefined();
    expect(CompanyProfile).toBeDefined();
  });

  it('renders CompanyForm without crashing', () => {
    render(<CompanyForm onSuccess={() => {}} onCancel={() => {}} />);
    expect(screen.getByText('Add New Company')).toBeInTheDocument();
  });

  it('renders CompanyCard without crashing', () => {
    render(
      <CompanyCard
        company={mockCompany}
        onEdit={() => {}}
        onDelete={() => {}}
        onView={() => {}}
      />
    );
    expect(screen.getByText('Test Company')).toBeInTheDocument();
  });

  it('renders CompanyList without crashing', () => {
    render(
      <CompanyList
        onAddCompany={() => {}}
        onEditCompany={() => {}}
        onViewCompany={() => {}}
      />
    );
    // Should show loading initially
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders CompanyProfile without crashing', () => {
    render(
      <CompanyProfile companyId="1" onBack={() => {}} onEdit={() => {}} />
    );
    // Should show loading initially
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});
