import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CompanyNotes } from '../CompanyNotes';
import { noteService } from '../../services/noteService';

// Mock the note service
jest.mock('../../services/noteService');
const mockNoteService = noteService as jest.Mocked<typeof noteService>;

// Mock data
const mockNotes = [
  {
    id: '1',
    content: 'This is the first note',
    companyId: 'company-1',
    userId: 'user-1',
    createdAt: '2023-01-01T10:00:00Z',
    updatedAt: '2023-01-01T10:00:00Z',
    user: {
      id: 'user-1',
      username: 'testuser',
    },
  },
  {
    id: '2',
    content: 'This is the second note',
    companyId: 'company-1',
    userId: 'user-2',
    createdAt: '2023-01-02T11:00:00Z',
    updatedAt: '2023-01-02T12:00:00Z',
    user: {
      id: 'user-2',
      username: 'anotheruser',
    },
  },
];

const defaultProps = {
  companyId: 'company-1',
  companyName: 'Test Company',
};

describe('CompanyNotes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should show loading spinner while fetching notes', () => {
      mockNoteService.getNotesByCompany.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<CompanyNotes {...defaultProps} />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('Notes Display', () => {
    it('should display notes when loaded successfully', async () => {
      mockNoteService.getNotesByCompany.mockResolvedValue(mockNotes);

      render(<CompanyNotes {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Notes for Test Company')).toBeInTheDocument();
      });

      expect(screen.getByText('This is the first note')).toBeInTheDocument();
      expect(screen.getByText('This is the second note')).toBeInTheDocument();
      expect(screen.getByText('testuser')).toBeInTheDocument();
      expect(screen.getByText('anotheruser')).toBeInTheDocument();
    });

    it('should display empty state when no notes exist', async () => {
      mockNoteService.getNotesByCompany.mockResolvedValue([]);

      render(<CompanyNotes {...defaultProps} />);

      await waitFor(() => {
        expect(
          screen.getByText(
            'No notes found for this company. Add the first note to get started.'
          )
        ).toBeInTheDocument();
      });
    });

    it('should display error message when loading fails', async () => {
      mockNoteService.getNotesByCompany.mockRejectedValue(
        new Error('Failed to load notes')
      );

      render(<CompanyNotes {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load notes')).toBeInTheDocument();
      });
    });

    it('should format dates correctly', async () => {
      mockNoteService.getNotesByCompany.mockResolvedValue(mockNotes);

      render(<CompanyNotes {...defaultProps} />);

      await waitFor(() => {
        // Check that dates are formatted (exact format may vary by locale)
        expect(screen.getByText(/1\/1\/2023/)).toBeInTheDocument();
        expect(screen.getByText(/1\/2\/2023/)).toBeInTheDocument();
      });
    });

    it('should show updated indicator when note was modified', async () => {
      mockNoteService.getNotesByCompany.mockResolvedValue(mockNotes);

      render(<CompanyNotes {...defaultProps} />);

      await waitFor(() => {
        // Second note has different created and updated times
        expect(screen.getByText(/Updated:/)).toBeInTheDocument();
      });
    });
  });

  describe('Add Note', () => {
    it('should open add note dialog when Add Note button is clicked', async () => {
      mockNoteService.getNotesByCompany.mockResolvedValue([]);

      render(<CompanyNotes {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Add Note')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Add Note'));

      expect(screen.getByText('Add New Note')).toBeInTheDocument();
      expect(screen.getByLabelText('Note Content')).toBeInTheDocument();
    });

    it('should create a new note when form is submitted', async () => {
      const newNote = {
        id: '3',
        content: 'New test note',
        companyId: 'company-1',
        userId: 'user-1',
        createdAt: '2023-01-03T10:00:00Z',
        updatedAt: '2023-01-03T10:00:00Z',
        user: {
          id: 'user-1',
          username: 'testuser',
        },
      };

      mockNoteService.getNotesByCompany.mockResolvedValue([]);
      mockNoteService.createNote.mockResolvedValue(newNote);

      const user = userEvent.setup();
      render(<CompanyNotes {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Add Note')).toBeInTheDocument();
      });

      // Open dialog
      await user.click(screen.getByText('Add Note'));

      // Fill in note content
      const textField = screen.getByLabelText('Note Content');
      await user.type(textField, 'New test note');

      // Submit form
      await user.click(screen.getByRole('button', { name: /add note/i }));

      await waitFor(() => {
        expect(mockNoteService.createNote).toHaveBeenCalledWith('company-1', {
          content: 'New test note',
        });
      });
    });

    it('should show error when note creation fails', async () => {
      mockNoteService.getNotesByCompany.mockResolvedValue([]);
      mockNoteService.createNote.mockRejectedValue(
        new Error('Failed to create note')
      );

      const user = userEvent.setup();
      render(<CompanyNotes {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Add Note')).toBeInTheDocument();
      });

      // Open dialog
      await user.click(screen.getByText('Add Note'));

      // Fill in note content
      const textField = screen.getByLabelText('Note Content');
      await user.type(textField, 'New test note');

      // Submit form
      await user.click(screen.getByRole('button', { name: /add note/i }));

      await waitFor(() => {
        expect(screen.getByText('Failed to create note')).toBeInTheDocument();
      });
    });

    it('should not allow submitting empty note', async () => {
      mockNoteService.getNotesByCompany.mockResolvedValue([]);

      const user = userEvent.setup();
      render(<CompanyNotes {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Add Note')).toBeInTheDocument();
      });

      // Open dialog
      await user.click(screen.getByText('Add Note'));

      // Try to submit without content
      const submitButton = screen.getByRole('button', { name: /add note/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Edit Note', () => {
    it('should open edit dialog when edit is clicked', async () => {
      mockNoteService.getNotesByCompany.mockResolvedValue(mockNotes);

      const user = userEvent.setup();
      render(<CompanyNotes {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('This is the first note')).toBeInTheDocument();
      });

      // Click menu button for first note
      const menuButtons = screen.getAllByLabelText('more');
      await user.click(menuButtons[0]);

      // Click edit
      await user.click(screen.getByText('Edit'));

      expect(screen.getByText('Edit Note')).toBeInTheDocument();
      expect(
        screen.getByDisplayValue('This is the first note')
      ).toBeInTheDocument();
    });

    it('should update note when edit form is submitted', async () => {
      const updatedNote = {
        ...mockNotes[0],
        content: 'Updated note content',
        updatedAt: '2023-01-01T11:00:00Z',
      };

      mockNoteService.getNotesByCompany.mockResolvedValue(mockNotes);
      mockNoteService.updateNote.mockResolvedValue(updatedNote);

      const user = userEvent.setup();
      render(<CompanyNotes {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('This is the first note')).toBeInTheDocument();
      });

      // Open edit dialog
      const menuButtons = screen.getAllByLabelText('more');
      await user.click(menuButtons[0]);
      await user.click(screen.getByText('Edit'));

      // Update content
      const textField = screen.getByDisplayValue('This is the first note');
      await user.clear(textField);
      await user.type(textField, 'Updated note content');

      // Submit
      await user.click(screen.getByRole('button', { name: /update note/i }));

      await waitFor(() => {
        expect(mockNoteService.updateNote).toHaveBeenCalledWith('1', {
          content: 'Updated note content',
        });
      });
    });
  });

  describe('Delete Note', () => {
    it('should delete note when delete is clicked', async () => {
      mockNoteService.getNotesByCompany.mockResolvedValue(mockNotes);
      mockNoteService.deleteNote.mockResolvedValue();

      const user = userEvent.setup();
      render(<CompanyNotes {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('This is the first note')).toBeInTheDocument();
      });

      // Click menu button for first note
      const menuButtons = screen.getAllByLabelText('more');
      await user.click(menuButtons[0]);

      // Click delete
      await user.click(screen.getByText('Delete'));

      await waitFor(() => {
        expect(mockNoteService.deleteNote).toHaveBeenCalledWith('1');
      });
    });

    it('should show error when delete fails', async () => {
      mockNoteService.getNotesByCompany.mockResolvedValue(mockNotes);
      mockNoteService.deleteNote.mockRejectedValue(
        new Error('Failed to delete note')
      );

      const user = userEvent.setup();
      render(<CompanyNotes {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('This is the first note')).toBeInTheDocument();
      });

      // Click menu button for first note
      const menuButtons = screen.getAllByLabelText('more');
      await user.click(menuButtons[0]);

      // Click delete
      await user.click(screen.getByText('Delete'));

      await waitFor(() => {
        expect(screen.getByText('Failed to delete note')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      mockNoteService.getNotesByCompany.mockResolvedValue(mockNotes);

      render(<CompanyNotes {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('This is the first note')).toBeInTheDocument();
      });

      // Check for menu buttons
      expect(screen.getAllByLabelText('more')).toHaveLength(2);
    });

    it('should support keyboard navigation', async () => {
      mockNoteService.getNotesByCompany.mockResolvedValue([]);

      render(<CompanyNotes {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Add Note')).toBeInTheDocument();
      });

      // Tab to Add Note button and press Enter
      const addButton = screen.getByText('Add Note');
      addButton.focus();
      fireEvent.keyDown(addButton, { key: 'Enter' });

      expect(screen.getByText('Add New Note')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should clear error when dialog is closed', async () => {
      mockNoteService.getNotesByCompany.mockResolvedValue([]);

      const user = userEvent.setup();
      render(<CompanyNotes {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Add Note')).toBeInTheDocument();
      });

      // Open dialog
      await user.click(screen.getByText('Add Note'));

      // Try to submit empty form to trigger error
      await user.click(screen.getByRole('button', { name: /add note/i }));

      // Close dialog
      await user.click(screen.getByText('Cancel'));

      // Reopen dialog - error should be cleared
      await user.click(screen.getByText('Add Note'));

      expect(
        screen.queryByText('Note content is required')
      ).not.toBeInTheDocument();
    });

    it('should handle network errors gracefully', async () => {
      mockNoteService.getNotesByCompany.mockRejectedValue(
        new Error('Network error')
      );

      render(<CompanyNotes {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });
  });
});
