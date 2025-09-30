/// <reference types="cypress" />
/// <reference path="../support/commands.ts" />

describe('Company Management Flow', () => {
  beforeEach(() => {
    cy.clearDatabase();
    cy.seedTestData();
    cy.loginAs('testuser', 'password123');
    cy.visit('/companies');
  });

  it('should create a new company', () => {
    // Click add company button
    cy.contains('Add Company').click();
    cy.url().should('include', '/companies/new');

    // Fill company form
    cy.fillCompanyForm({
      name: 'Test Company',
      email: 'company@test.com',
      phoneNumber: '+1234567890',
      website: 'https://test.com',
      startDate: '2024-01-01',
    });

    // Submit form
    cy.get('button[type="submit"]').click();

    // Should redirect to company list
    cy.url().should('include', '/companies');
    cy.contains('Company created successfully').should('be.visible');
    cy.contains('Test Company').should('be.visible');
  });

  it('should view company details', () => {
    // Create a company first
    cy.contains('Add Company').click();
    cy.fillCompanyForm({
      name: 'Test Company',
      email: 'company@test.com',
      phoneNumber: '+1234567890',
      website: 'https://test.com',
      startDate: '2024-01-01',
    });
    cy.get('button[type="submit"]').click();

    // Click on company to view details
    cy.contains('Test Company').click();
    cy.url().should('match', /\/companies\/[a-zA-Z0-9-]+$/);

    // Verify company details are displayed
    cy.contains('Test Company').should('be.visible');
    cy.contains('company@test.com').should('be.visible');
    cy.contains('+1234567890').should('be.visible');
    cy.contains('https://test.com').should('be.visible');
  });

  it('should edit company information', () => {
    // Create a company first
    cy.contains('Add Company').click();
    cy.fillCompanyForm({
      name: 'Test Company',
      email: 'company@test.com',
      phoneNumber: '+1234567890',
      website: 'https://test.com',
      startDate: '2024-01-01',
    });
    cy.get('button[type="submit"]').click();

    // Click on company to view details
    cy.contains('Test Company').click();

    // Click edit button
    cy.contains('Edit').click();

    // Update company name
    cy.get('[name="name"]').clear().type('Updated Company Name');

    // Submit changes
    cy.get('button[type="submit"]').click();

    // Verify changes are saved
    cy.contains('Company updated successfully').should('be.visible');
    cy.contains('Updated Company Name').should('be.visible');
  });

  it('should filter companies by tier', () => {
    // Create companies with different tiers
    const companies = [
      { name: 'Tier 1 Company', tier: 'TIER_1' },
      { name: 'Tier 2 Company', tier: 'TIER_2' },
      { name: 'Tier 3 Company', tier: 'TIER_3' },
    ];

    companies.forEach((company) => {
      cy.contains('Add Company').click();
      cy.fillCompanyForm({
        name: company.name,
        email: `${company.name.toLowerCase().replace(/\s+/g, '')}@test.com`,
        phoneNumber: '+1234567890',
        website: 'https://test.com',
        startDate: '2024-01-01',
      });
      cy.get('button[type="submit"]').click();
    });

    // Filter by Tier 1
    cy.get('[data-testid="tier-filter"]').click();
    cy.contains('Tier 1').click();

    // Should only show Tier 1 companies
    cy.contains('Tier 1 Company').should('be.visible');
    cy.contains('Tier 2 Company').should('not.exist');
    cy.contains('Tier 3 Company').should('not.exist');

    // Clear filter
    cy.get('[data-testid="clear-filter"]').click();

    // Should show all companies
    cy.contains('Tier 1 Company').should('be.visible');
    cy.contains('Tier 2 Company').should('be.visible');
    cy.contains('Tier 3 Company').should('be.visible');
  });

  it('should delete a company', () => {
    // Create a company first
    cy.contains('Add Company').click();
    cy.fillCompanyForm({
      name: 'Company to Delete',
      email: 'delete@test.com',
      phoneNumber: '+1234567890',
      website: 'https://test.com',
      startDate: '2024-01-01',
    });
    cy.get('button[type="submit"]').click();

    // Click on company to view details
    cy.contains('Company to Delete').click();

    // Click delete button
    cy.contains('Delete').click();

    // Confirm deletion
    cy.contains('Confirm').click();

    // Should redirect to company list
    cy.url().should('include', '/companies');
    cy.contains('Company deleted successfully').should('be.visible');
    cy.contains('Company to Delete').should('not.exist');
  });
});