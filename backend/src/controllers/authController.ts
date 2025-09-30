import { Request, Response } from 'express';
import { UserModel, CreateUserData } from '../models/AppwriteUser';
import { JwtService } from '../utils/jwt';
import { ValidationError, NotFoundError, UnauthorizedError } from '../middleware/errorHandler';
import bcrypt from 'bcryptjs';

interface LoginCredentials {
  username: string;
  password: string;
}

export class AuthController {
  // Register new user
  static async register(req: Request, res: Response): Promise<void> {
    const userData: CreateUserData = req.body;
    
    // Hash password
    const saltRounds = 12;
    userData.password = await bcrypt.hash(userData.password, saltRounds);
    
    // Create user
    const user = await UserModel.create(userData);
    
    // Generate tokens
    const tokenPair = JwtService.generateTokenPair({
      userId: user.$id,
      username: user.username,
      email: user.email,
      role: user.role
    });

    res.status(201).json({
      success: true,
      data: {
        user,
        token: tokenPair.accessToken,
        refreshToken: tokenPair.refreshToken
      },
      message: 'User registered successfully'
    });
  }

  // Login user
  static async login(req: Request, res: Response): Promise<void> {
    const credentials: LoginCredentials = req.body;
    
    // Find user by username
    const user = await UserModel.findByUsername(credentials.username);
    
    if (!user) {
      throw new UnauthorizedError('Invalid username or password');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(credentials.password, user.password);
    
    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid username or password');
    }

    // Generate tokens
    const tokenPair = JwtService.generateTokenPair({
      userId: user.$id,
      username: user.username,
      email: user.email,
      role: user.role
    });

    res.status(200).json({
      success: true,
      data: {
        user,
        token: tokenPair.accessToken,
        refreshToken: tokenPair.refreshToken
      },
      message: 'Login successful'
    });
  }

  // Refresh access token
  static async refresh(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_REFRESH_TOKEN',
            message: 'Refresh token is required'
          }
        });
        return;
      }

      // Verify refresh token
      const payload = JwtService.verifyRefreshToken(refreshToken);
      
      // Get user details
      const user = await UserModel.findById(payload.userId);
      if (!user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User no longer exists'
          }
        });
        return;
      }

      // Generate new token pair
      const tokenPair = JwtService.generateTokenPair({
        userId: user.$id,
        username: user.username,
        email: user.email,
        role: user.role
      });

      res.status(200).json({
        success: true,
        data: {
          tokens: tokenPair
        },
        message: 'Token refreshed successfully'
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Token refresh failed';
      
      res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_REFRESH_FAILED',
          message: errorMessage
        }
      });
    }
  }

  // Get current user profile
  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication is required'
          }
        });
        return;
      }

      const user = await UserModel.findById(req.user.userId);
      
      if (!user) {
        res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found'
          }
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: { user },
        message: 'Profile retrieved successfully'
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get profile';
      
      res.status(500).json({
        success: false,
        error: {
          code: 'PROFILE_FETCH_FAILED',
          message: errorMessage
        }
      });
    }
  }

  // Logout (client-side token removal, server-side could implement token blacklisting)
  static async logout(req: Request, res: Response): Promise<void> {
    // For now, just return success - client should remove tokens
    // In a production app, you might want to implement token blacklisting
    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  }
}