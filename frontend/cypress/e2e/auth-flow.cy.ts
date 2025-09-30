describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.clearDatabase();
    cy.visit('/');
  });

  it('should complete user registration and login flow', () => {
    // Navigate to registration
    cy.contains('Don\'t have an account?').click();
    cy.url().should('include', '/register');

    // Fill registration form
    cy.fillRegistrationForm({
      username: 'testuser',
      email: 'test@example.com',
      phoneNumber: '+1234567890',
      password: 'password123',
    });

    // Submit registration
    cy.get('button[type="submit"]').click();

    // Should redirect to login
    cy.url().should('include', '/login');
    cy.contains('Registration successful').should('be.visible');

    // Fill login form
    cy.fillLoginForm('testuser', 'password123');

    // Submit login
    cy.get('button[type="submit"]').click();

    // Should redirect to dashboard
    cy.url().should('include', '/dashboard');
    cy.contains('Dashboard').should('be.visible');
  });

  it('should handle login with invalid credentials', () => {
    // Try to login with invalid credentials
    cy.fillLoginForm('invaliduser', 'wrongpassword');
    cy.get('button[type="submit"]').click();

    // Should show error message
    cy.contains('Invalid credentials').should('be.visible');
    cy.url().should('include', '/login');
  });

  it('should handle logout flow', () => {
    // First login
    cy.seedTestData();
    cy.loginAs('testuser', 'password123');
    cy.visit('/dashboard');

    // Logout
    cy.get('[data-testid="user-menu"]').click();
    cy.contains('Logout').click();

    // Should redirect to login
    cy.url().should('include', '/login');
    cy.window().its('localStorage.token').should('be.undefined');
  });

  it('should protect routes when not authenticated', () => {
    // Try to access protected route
    cy.visit('/dashboard');

    // Should redirect to login
    cy.url().should('include', '/login');
  });
});