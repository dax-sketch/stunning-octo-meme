import { Response } from 'express';
import { Note } from '../models/AppwriteNote';
import { AuthenticatedRequest } from '../middleware/auth';

/**
 * Get all notes for a company
 */
export const getNotesByCompany = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { companyId } = req.params;

    if (!companyId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_COMPANY_ID',
          message: 'Company ID is required',
        },
      });
      return;
    }

    const notes = await Note.findByCompanyId(companyId);

    res.status(200).json({
      success: true,
      data: notes,
    });
  } catch (error: any) {
    console.error('Error fetching notes:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_NOTES_ERROR',
        message: error.message || 'Failed to fetch notes',
      },
    });
  }
};

/**
 * Create a new note
 */
export const createNote = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { companyId } = req.params;
    const { content } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User authentication required',
        },
      });
      return;
    }

    if (!companyId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_COMPANY_ID',
          message: 'Company ID is required',
        },
      });
      return;
    }

    // Basic validation
    if (!content || content.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Note content is required',
        },
      });
      return;
    }

    const note = await Note.create({
      content,
      companyId,
      userId,
    });

    res.status(201).json({
      success: true,
      data: note,
    });
  } catch (error: any) {
    console.error('Error creating note:', error);

    if (error.message.includes('not found')) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: error.message,
        },
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_NOTE_ERROR',
        message: error.message || 'Failed to create note',
      },
    });
  }
};

/**
 * Get a specific note by ID
 */
export const getNoteById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { noteId } = req.params;

    if (!noteId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_NOTE_ID',
          message: 'Note ID is required',
        },
      });
      return;
    }

    const note = await Note.findById(noteId);

    if (!note) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOTE_NOT_FOUND',
          message: 'Note not found',
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: note,
    });
  } catch (error: any) {
    console.error('Error fetching note:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_NOTE_ERROR',
        message: error.message || 'Failed to fetch note',
      },
    });
  }
};

/**
 * Update a note
 */
export const updateNote = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { noteId } = req.params;
    const { content } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User authentication required',
        },
      });
      return;
    }

    if (!noteId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_NOTE_ID',
          message: 'Note ID is required',
        },
      });
      return;
    }

    // Basic validation
    if (!content || content.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Note content is required',
        },
      });
      return;
    }

    const updatedNote = await Note.update(noteId, { content });

    res.status(200).json({
      success: true,
      data: updatedNote,
    });
  } catch (error: any) {
    console.error('Error updating note:', error);

    if (error.message.includes('not found')) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOTE_NOT_FOUND',
          message: error.message,
        },
      });
      return;
    }

    if (error.message.includes('Unauthorized')) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: error.message,
        },
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_NOTE_ERROR',
        message: error.message || 'Failed to update note',
      },
    });
  }
};

/**
 * Delete a note
 */
export const deleteNote = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { noteId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User authentication required',
        },
      });
      return;
    }

    if (!noteId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_NOTE_ID',
          message: 'Note ID is required',
        },
      });
      return;
    }

    await Note.delete(noteId);

    res.status(200).json({
      success: true,
      message: 'Note deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting note:', error);

    if (error.message.includes('not found')) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOTE_NOT_FOUND',
          message: error.message,
        },
      });
      return;
    }

    if (error.message.includes('Unauthorized')) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: error.message,
        },
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_NOTE_ERROR',
        message: error.message || 'Failed to delete note',
      },
    });
  }
};

/**
 * Get all notes by the current user
 */
export const getUserNotes = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User authentication required',
        },
      });
      return;
    }

    const notes = await Note.findByUserId(userId);

    res.status(200).json({
      success: true,
      data: notes,
    });
  } catch (error: any) {
    console.error('Error fetching user notes:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_USER_NOTES_ERROR',
        message: error.message || 'Failed to fetch user notes',
      },
    });
  }
};