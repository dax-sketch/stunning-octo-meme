import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { authenticate as authMiddleware } from '../middleware/auth';

const router = Router();

// All user routes require authentication
router.use(authMiddleware);

// Get all users (for audit assignment)
router.get('/', UserController.getUsers);

// Update user profile
router.put('/profile', UserController.updateProfile);

// Update notification preferences
router.put('/notification-preferences', UserController.updateNotificationPreferences);

// Test notification functionality
router.post('/test-notification', UserController.testNotification);

export default router;