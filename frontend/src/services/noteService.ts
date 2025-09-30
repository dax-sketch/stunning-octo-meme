import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export interface Note {
  id: string;
  content: string;
  companyId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    username: string;
  };
}

export interface CreateNoteData {
  content: string;
}

export interface UpdateNoteData {
  content: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

class NoteService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Get all notes for a company
   */
  async getNotesByCompany(companyId: string): Promise<Note[]> {
    try {
      const response = await axios.get<ApiResponse<Note[]>>(
        `${API_BASE_URL}/api/notes/company/${companyId}`,
        { headers: this.getAuthHeaders() }
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error(
          response.data.error?.message || 'Failed to fetch notes'
        );
      }
    } catch (error: any) {
      if (error.response?.data?.error?.message) {
        throw new Error(error.response.data.error.message);
      }
      throw new Error('Failed to fetch notes');
    }
  }

  /**
   * Create a new note for a company
   */
  async createNote(companyId: string, noteData: CreateNoteData): Promise<Note> {
    try {
      const response = await axios.post<ApiResponse<Note>>(
        `${API_BASE_URL}/api/notes/company/${companyId}`,
        noteData,
        { headers: this.getAuthHeaders() }
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error(
          response.data.error?.message || 'Failed to create note'
        );
      }
    } catch (error: any) {
      if (error.response?.data?.error?.message) {
        throw new Error(error.response.data.error.message);
      }
      throw new Error('Failed to create note');
    }
  }

  /**
   * Get a specific note by ID
   */
  async getNoteById(noteId: string): Promise<Note> {
    try {
      const response = await axios.get<ApiResponse<Note>>(
        `${API_BASE_URL}/api/notes/note/${noteId}`,
        { headers: this.getAuthHeaders() }
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error(response.data.error?.message || 'Failed to fetch note');
      }
    } catch (error: any) {
      if (error.response?.data?.error?.message) {
        throw new Error(error.response.data.error.message);
      }
      throw new Error('Failed to fetch note');
    }
  }

  /**
   * Update a note
   */
  async updateNote(noteId: string, noteData: UpdateNoteData): Promise<Note> {
    try {
      const response = await axios.put<ApiResponse<Note>>(
        `${API_BASE_URL}/api/notes/note/${noteId}`,
        noteData,
        { headers: this.getAuthHeaders() }
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error(
          response.data.error?.message || 'Failed to update note'
        );
      }
    } catch (error: any) {
      if (error.response?.data?.error?.message) {
        throw new Error(error.response.data.error.message);
      }
      throw new Error('Failed to update note');
    }
  }

  /**
   * Delete a note
   */
  async deleteNote(noteId: string): Promise<void> {
    try {
      const response = await axios.delete<ApiResponse<void>>(
        `${API_BASE_URL}/api/notes/note/${noteId}`,
        { headers: this.getAuthHeaders() }
      );

      if (!response.data.success) {
        throw new Error(
          response.data.error?.message || 'Failed to delete note'
        );
      }
    } catch (error: any) {
      if (error.response?.data?.error?.message) {
        throw new Error(error.response.data.error.message);
      }
      throw new Error('Failed to delete note');
    }
  }

  /**
   * Get all notes by the current user
   */
  async getUserNotes(): Promise<Note[]> {
    try {
      const response = await axios.get<ApiResponse<Note[]>>(
        `${API_BASE_URL}/api/notes/user`,
        { headers: this.getAuthHeaders() }
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error(
          response.data.error?.message || 'Failed to fetch user notes'
        );
      }
    } catch (error: any) {
      if (error.response?.data?.error?.message) {
        throw new Error(error.response.data.error.message);
      }
      throw new Error('Failed to fetch user notes');
    }
  }
}

export const noteService = new NoteService();
