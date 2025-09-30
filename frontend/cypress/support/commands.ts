/// <reference types="cypress" />

// Custom commands for common actions
Cypress.Commands.add('getByTestId', (testId: string) => {
  return cy.get(`[data-testid="${testId}"]`);
});

Cypress.Commands.add('fillCompanyForm', (company: {
  name: string;
  email: string;
  phoneNumber: string;
  website: string;
  startDate: string;
}) => {
  cy.get('[name="name"]').type(company.name);
  cy.get('[name="email"]').type(company.email);
  cy.get('[name="phoneNumber"]').type(company.phoneNumber);
  cy.get('[name="website"]').type(company.website);
  cy.get('[name="startDate"]').type(company.startDate);
});

Cypress.Commands.add('fillLoginForm', (username: string, password: string) => {
  cy.get('[name="username"]').type(username);
  cy.get('[name="password"]').type(password);
});

Cypress.Commands.add('fillRegistrationForm', (user: {
  username: string;
  email: string;
  phoneNumber: string;
  password: string;
}) => {
  cy.get('[name="username"]').type(user.username);
  cy.get('[name="email"]').type(user.email);
  cy.get('[name="phoneNumber"]').type(user.phoneNumber);
  cy.get('[name="password"]').type(user.password);
});

declare global {
  namespace Cypress {
    interface Chainable {
      getByTestId(testId: string): Chainable<JQuery<HTMLElement>>;
      fillCompanyForm(company: {
        name: string;
        email: string;
        phoneNumber: string;
        website: string;
        startDate: string;
      }): Chainable<void>;
      fillLoginForm(username: string, password: string): Chainable<void>;
      fillRegistrationForm(user: {
        username: string;
        email: string;
        phoneNumber: string;
        password: string;
      }): Chainable<void>;
    }
  }
}