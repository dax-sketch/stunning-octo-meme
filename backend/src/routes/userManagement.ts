import { Router } from 'express';
import { UserManagementController } from '../controllers/userManagementController';
import { authenticate } from '../middleware/auth';

const router = Router();
const userManagementController = new UserManagementController();

// Apply authentication middleware to all routes
router.use(authenticate);

// User management operations (admin only)
router.post('/', userManagementController.createUser);
router.get('/', userManagementController.getAllUsers);
router.delete('/:id', userManagementController.deleteUser);

export default router;