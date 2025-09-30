/// <reference types="cypress" />
/// <reference path="../support/commands.ts" />

describe('Notes Management Flow', () => {
  beforeEach(() => {
    cy.clearDatabase();
    cy.seedTestData();
    cy.loginAs('testuser', 'password123');
    
    // Create a test company
    cy.visit('/companies');
    cy.contains('Add Company').click();
    cy.fillCompanyForm({
      name: 'Test Company',
      email: 'company@test.com',
      phoneNumber: '+1234567890',
      website: 'https://test.com',
      startDate: '2024-01-01',
    });
    cy.get('button[type="submit"]').click();
    
    // Navigate to company details
    cy.contains('Test Company').click();
  });

  it('should add a note to a company', () => {
    // Navigate to notes tab
    cy.contains('Notes').click();

    // Add a new note
    cy.get('[data-testid="note-input"]').type('This is a test note about the company.');
    cy.get('[data-testid="add-note-button"]').click();

    // Verify note is added
    cy.contains('Note added successfully').should('be.visible');
    cy.contains('This is a test note about the company.').should('be.visible');
  });

  it('should display note timestamp and author', () => {
    // Navigate to notes tab
    cy.contains('Notes').click();

    // Add a note
    cy.get('[data-testid="note-input"]').type('Test note with timestamp.');
    cy.get('[data-testid="add-note-button"]').click();

    // Verify note metadata is displayed
    cy.contains('testuser').should('be.visible');
    cy.get('[data-testid="note-timestamp"]').should('be.visible');
  });

  it('should edit an existing note', () => {
    // Navigate to notes tab
    cy.contains('Notes').click();

    // Add a note first
    cy.get('[data-testid="note-input"]').type('Original note content.');
    cy.get('[data-testid="add-note-button"]').click();

    // Edit the note
    cy.get('[data-testid="edit-note-button"]').first().click();
    cy.get('[data-testid="edit-note-input"]').clear().type('Updated note content.');
    cy.get('[data-testid="save-note-button"]').click();

    // Verify note is updated
    cy.contains('Note updated successfully').should('be.visible');
    cy.contains('Updated note content.').should('be.visible');
    cy.contains('Original note content.').should('not.exist');
  });

  it('should delete a note', () => {
    // Navigate to notes tab
    cy.contains('Notes').click();

    // Add a note first
    cy.get('[data-testid="note-input"]').type('Note to be deleted.');
    cy.get('[data-testid="add-note-button"]').click();

    // Delete the note
    cy.get('[data-testid="delete-note-button"]').first().click();
    cy.contains('Confirm').click();

    // Verify note is deleted
    cy.contains('Note deleted successfully').should('be.visible');
    cy.contains('Note to be deleted.').should('not.exist');
  });

  it('should display notes in chronological order', () => {
    // Navigate to notes tab
    cy.contains('Notes').click();

    // Add multiple notes
    const notes = [
      'First note',
      'Second note',
      'Third note',
    ];

    notes.forEach((note, index) => {
      cy.get('[data-testid="note-input"]').type(note);
      cy.get('[data-testid="add-note-button"]').click();
      cy.wait(1000); // Ensure different timestamps
    });

    // Verify notes are displayed in reverse chronological order (newest first)
    cy.get('[data-testid="note-item"]').first().should('contain', 'Third note');
    cy.get('[data-testid="note-item"]').last().should('contain', 'First note');
  });

  it('should validate note content', () => {
    // Navigate to notes tab
    cy.contains('Notes').click();

    // Try to add empty note
    cy.get('[data-testid="add-note-button"]').click();

    // Should show validation error
    cy.contains('Note content is required').should('be.visible');

    // Try to add note with only whitespace
    cy.get('[data-testid="note-input"]').type('   ');
    cy.get('[data-testid="add-note-button"]').click();

    // Should show validation error
    cy.contains('Note content cannot be empty').should('be.visible');
  });
});