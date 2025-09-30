import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { validate, validationSchemas } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Public routes
router.post('/register', 
  validate(validationSchemas.userRegistration), 
  asyncHandler(AuthController.register)
);
router.post('/login', 
  validate(validationSchemas.userLogin), 
  asyncHandler(AuthController.login)
);
router.post('/refresh', asyncHandler(AuthController.refresh));
router.post('/logout', asyncHandler(AuthController.logout));

// Protected routes
router.get('/profile', authenticate, asyncHandler(AuthController.getProfile));

export default router;