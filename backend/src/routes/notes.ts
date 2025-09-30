import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getNotesByCompany,
  createNote,
  getNoteById,
  updateNote,
  deleteNote,
  getUserNotes,
} from '../controllers/noteController';

const router = Router();

// Note: Authentication is applied per route

// Company-specific note routes
router.get('/company/:companyId', authenticate, getNotesByCompany);
router.post('/company/:companyId', authenticate, createNote);

// Individual note routes
router.get('/note/:noteId', authenticate, getNoteById);
router.put('/note/:noteId', authenticate, updateNote);
router.delete('/note/:noteId', authenticate, deleteNote);

// User notes route
router.get('/user', authenticate, getUserNotes);

export default router;