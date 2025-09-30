// Import commands.js using ES2015 syntax:
import './commands';

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Hide fetch/XHR requests from command log
Cypress.on('window:before:load', (win) => {
  cy.stub(win.console, 'error').as('consoleError');
  cy.stub(win.console, 'warn').as('consoleWarn');
});

// Custom command to clear database before tests
Cypress.Commands.add('clearDatabase', () => {
  cy.request('POST', `${Cypress.env('apiUrl')}/test/clear-database`);
});

// Custom command to seed test data
Cypress.Commands.add('seedTestData', () => {
  cy.request('POST', `${Cypress.env('apiUrl')}/test/seed-data`);
});

// Custom command to login programmatically
Cypress.Commands.add('loginAs', (username: string, password: string) => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/auth/login`,
    body: { username, password },
  }).then((response) => {
    window.localStorage.setItem('token', response.body.data.token);
    window.localStorage.setItem('user', JSON.stringify(response.body.data.user));
  });
});

declare global {
  namespace Cypress {
    interface Chainable {
      clearDatabase(): Chainable<void>;
      seedTestData(): Chainable<void>;
      loginAs(username: string, password: string): Chainable<void>;
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