import { Request, Response } from 'express';
import { UserCreationService } from '../services/userCreationService';
import { JwtPayload } from '../utils/jwt';

interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export class UserManagementController {
  private userCreationService: UserCreationService;

  constructor() {
    this.userCreationService = new UserCreationService();
  }

  /**
   * Create a new user (admin only)
   */
  createUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { email, password, username, role } = req.body;
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

      if (!email || !password || !username || !role) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Missing required fields: email, password, username, role',
          },
        });
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid email format',
          },
        });
        return;
      }

      // Validate password length
      if (password.length < 8) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Password must be at least 8 characters long',
          },
        });
        return;
      }

      // Validate username length
      if (username.length < 3) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Username must be at least 3 characters long',
          },
        });
        return;
      }

      // Validate role
      const validRoles = ['CEO', 'MANAGER', 'TEAM_MEMBER'];
      if (!validRoles.includes(role)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid role. Must be CEO, MANAGER, or TEAM_MEMBER',
          },
        });
        return;
      }

      const user = await this.userCreationService.createUser({
        email,
        password,
        username,
        role,
      }, userId);

      res.status(201).json({
        success: true,
        data: user,
      });
    } catch (error: any) {
      console.error('Error creating user:', error);
      
      if (error.message.includes('permissions')) {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: error.message,
          },
        });
        return;
      }

      if (error.message.includes('already exists') || error.message.includes('already taken')) {
        res.status(409).json({
          success: false,
          error: {
            code: 'CONFLICT',
            message: error.message,
          },
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to create user',
        },
      });
    }
  };

  /**
   * Get all users (admin only)
   */
  getAllUsers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

      const users = await this.userCreationService.getAllUsers(userId);

      res.json({
        success: true,
        data: users,
      });
    } catch (error: any) {
      console.error('Error fetching users:', error);
      
      if (error.message.includes('permissions')) {
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
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to fetch users',
        },
      });
    }
  };

  /**
   * Delete user (admin only)
   */
  deleteUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
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

      if (!id) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'User ID is required',
          },
        });
        return;
      }

      await this.userCreationService.deleteUser(id, userId);

      res.json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error: any) {
      console.error('Error deleting user:', error);
      
      if (error.message.includes('permissions') || error.message.includes('Cannot delete')) {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: error.message,
          },
        });
        return;
      }

      if (error.message === 'User not found') {
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
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to delete user',
        },
      });
    }
  };
}