import axios from 'axios';
import { noteService } from '../noteService';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('NoteService', () => {
  const mockToken = 'mock-jwt-token';
  const mockCompanyId = 'company-123';
  const mockNoteId = 'note-123';

  const mockNote = {
    id: 'note-123',
    content: 'Test note content',
    companyId: 'company-123',
    userId: 'user-123',
    createdAt: '2023-01-01T10:00:00Z',
    updatedAt: '2023-01-01T10:00:00Z',
    user: {
      id: 'user-123',
      username: 'testuser',
    },
  };

  const mockNotes = [mockNote];

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(mockToken);
  });

  describe('getNotesByCompany', () => {
    it('should fetch notes for a company successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: mockNotes,
        },
      };
      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await noteService.getNotesByCompany(mockCompanyId);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        `http://localhost:3001/api/notes/company/${mockCompanyId}`,
        {
          headers: {
            Authorization: `Bearer ${mockToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      expect(result).toEqual(mockNotes);
    });

    it('should throw error when API returns error response', async () => {
      const mockResponse = {
        data: {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Company not found',
          },
        },
      };
      mockedAxios.get.mockResolvedValue(mockResponse);

      await expect(
        noteService.getNotesByCompany(mockCompanyId)
      ).rejects.toThrow('Company not found');
    });

    it('should throw error when network request fails', async () => {
      const mockError = {
        response: {
          data: {
            error: {
              message: 'Network error',
            },
          },
        },
      };
      mockedAxios.get.mockRejectedValue(mockError);

      await expect(
        noteService.getNotesByCompany(mockCompanyId)
      ).rejects.toThrow('Network error');
    });

    it('should throw generic error when no specific error message', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Unknown error'));

      await expect(
        noteService.getNotesByCompany(mockCompanyId)
      ).rejects.toThrow('Failed to fetch notes');
    });
  });

  describe('createNote', () => {
    const createNoteData = { content: 'New note content' };

    it('should create a note successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: mockNote,
        },
      };
      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await noteService.createNote(
        mockCompanyId,
        createNoteData
      );

      expect(mockedAxios.post).toHaveBeenCalledWith(
        `http://localhost:3001/api/notes/company/${mockCompanyId}`,
        createNoteData,
        {
          headers: {
            Authorization: `Bearer ${mockToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      expect(result).toEqual(mockNote);
    });

    it('should throw error when creation fails', async () => {
      const mockResponse = {
        data: {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Note content is required',
          },
        },
      };
      mockedAxios.post.mockResolvedValue(mockResponse);

      await expect(
        noteService.createNote(mockCompanyId, createNoteData)
      ).rejects.toThrow('Note content is required');
    });
  });

  describe('getNoteById', () => {
    it('should fetch a specific note successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: mockNote,
        },
      };
      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await noteService.getNoteById(mockNoteId);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        `http://localhost:3001/api/notes/note/${mockNoteId}`,
        {
          headers: {
            Authorization: `Bearer ${mockToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      expect(result).toEqual(mockNote);
    });

    it('should throw error when note not found', async () => {
      const mockResponse = {
        data: {
          success: false,
          error: {
            code: 'NOTE_NOT_FOUND',
            message: 'Note not found',
          },
        },
      };
      mockedAxios.get.mockResolvedValue(mockResponse);

      await expect(noteService.getNoteById(mockNoteId)).rejects.toThrow(
        'Note not found'
      );
    });
  });

  describe('updateNote', () => {
    const updateNoteData = { content: 'Updated note content' };

    it('should update a note successfully', async () => {
      const updatedNote = { ...mockNote, content: 'Updated note content' };
      const mockResponse = {
        data: {
          success: true,
          data: updatedNote,
        },
      };
      mockedAxios.put.mockResolvedValue(mockResponse);

      const result = await noteService.updateNote(mockNoteId, updateNoteData);

      expect(mockedAxios.put).toHaveBeenCalledWith(
        `http://localhost:3001/api/notes/note/${mockNoteId}`,
        updateNoteData,
        {
          headers: {
            Authorization: `Bearer ${mockToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      expect(result).toEqual(updatedNote);
    });

    it('should throw error when update fails', async () => {
      const mockResponse = {
        data: {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You can only edit your own notes',
          },
        },
      };
      mockedAxios.put.mockResolvedValue(mockResponse);

      await expect(
        noteService.updateNote(mockNoteId, updateNoteData)
      ).rejects.toThrow('You can only edit your own notes');
    });
  });

  describe('deleteNote', () => {
    it('should delete a note successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
        },
      };
      mockedAxios.delete.mockResolvedValue(mockResponse);

      await noteService.deleteNote(mockNoteId);

      expect(mockedAxios.delete).toHaveBeenCalledWith(
        `http://localhost:3001/api/notes/note/${mockNoteId}`,
        {
          headers: {
            Authorization: `Bearer ${mockToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
    });

    it('should throw error when deletion fails', async () => {
      const mockResponse = {
        data: {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You can only delete your own notes',
          },
        },
      };
      mockedAxios.delete.mockResolvedValue(mockResponse);

      await expect(noteService.deleteNote(mockNoteId)).rejects.toThrow(
        'You can only delete your own notes'
      );
    });
  });

  describe('getUserNotes', () => {
    it('should fetch user notes successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: mockNotes,
        },
      };
      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await noteService.getUserNotes();

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:3001/api/notes/user',
        {
          headers: {
            Authorization: `Bearer ${mockToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      expect(result).toEqual(mockNotes);
    });

    it('should throw error when fetching user notes fails', async () => {
      const mockResponse = {
        data: {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User authentication required',
          },
        },
      };
      mockedAxios.get.mockResolvedValue(mockResponse);

      await expect(noteService.getUserNotes()).rejects.toThrow(
        'User authentication required'
      );
    });
  });

  describe('Authentication', () => {
    it('should include authorization header when token is available', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: mockNotes,
        },
      };
      mockedAxios.get.mockResolvedValue(mockResponse);

      await noteService.getNotesByCompany(mockCompanyId);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockToken}`,
          }),
        })
      );
    });

    it('should handle missing token gracefully', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const mockResponse = {
        data: {
          success: true,
          data: mockNotes,
        },
      };
      mockedAxios.get.mockResolvedValue(mockResponse);

      await noteService.getNotesByCompany(mockCompanyId);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer null',
          }),
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle axios errors with response data', async () => {
      const mockError = {
        response: {
          data: {
            error: {
              message: 'Specific API error',
            },
          },
        },
      };
      mockedAxios.get.mockRejectedValue(mockError);

      await expect(
        noteService.getNotesByCompany(mockCompanyId)
      ).rejects.toThrow('Specific API error');
    });

    it('should handle axios errors without response data', async () => {
      const mockError = new Error('Network connection failed');
      mockedAxios.get.mockRejectedValue(mockError);

      await expect(
        noteService.getNotesByCompany(mockCompanyId)
      ).rejects.toThrow('Failed to fetch notes');
    });

    it('should handle malformed API responses', async () => {
      const mockResponse = {
        data: {
          success: true,
          // Missing data field
        },
      };
      mockedAxios.get.mockResolvedValue(mockResponse);

      await expect(
        noteService.getNotesByCompany(mockCompanyId)
      ).rejects.toThrow('Failed to fetch notes');
    });
  });
});
