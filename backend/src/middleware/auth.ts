import { Request, Response, NextFunction } from 'express';
import { JwtService, JwtPayload } from '../utils/jwt';
import { UserModel } from '../models/AppwriteUser';
import { type UserRole } from '../config/appwrite';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

// Authentication middleware
export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Extract token from Authorization header
    const token = JwtService.extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      res.status(401).json({
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: 'Access token is required'
        }
      });
      return;
    }

    // Verify token
    const payload = JwtService.verifyAccessToken(token);
    
    // Verify user still exists
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

    // Add user to request
    req.user = payload;
    next();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
    
    res.status(401).json({
      success: false,
      error: {
        code: 'AUTHENTICATION_FAILED',
        message: errorMessage
      }
    });
  }
};

// Authorization middleware factory
export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
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

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Insufficient permissions to access this resource'
        }
      });
      return;
    }

    next();
  };
};

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = JwtService.extractTokenFromHeader(req.headers.authorization);
    
    if (token) {
      const payload = JwtService.verifyAccessToken(token);
      const user = await UserModel.findById(payload.userId);
      
      if (user) {
        req.user = payload;
      }
    }
    
    next();
  } catch (error) {
    // Ignore authentication errors in optional auth
    next();
  }
};