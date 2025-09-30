import { Request, Response, NextFunction } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { JwtService } from '../utils/jwt';
import { UserModel } from '../models/User';

// Mock dependencies
jest.mock('../utils/jwt');
jest.mock('../models/User');

const mockJwtService = JwtService as jest.Mocked<typeof JwtService>;
const mockUserModel = UserModel as jest.Mocked<typeof UserModel>;

describe('Authentication Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {}
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('authenticate middleware', () => {
    it('should authenticate user with valid token', async () => {
      const mockPayload = {
        userId: 'user_id',
        username: 'testuser',
        email: 'test@example.com',
        role: 'TEAM_MEMBER' as const
      };

      const mockUser = {
        id: 'user_id',
        username: 'testuser',
        email: 'test@example.com',
        phoneNumber: '+1234567890',
        role: 'TEAM_MEMBER' as const,
        emailNotifications: true,
        smsNotifications: true,
        meetingReminders: true,
        auditReminders: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockRequest.headers = {
        authorization: 'Bearer valid_token'
      };

      mockJwtService.extractTokenFromHeader.mockReturnValue('valid_token');
      mockJwtService.verifyAccessToken.mockReturnValue(mockPayload);
      mockUserModel.findById.mockResolvedValue(mockUser);

      await authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockJwtService.extractTokenFromHeader).toHaveBeenCalledWith('Bearer valid_token');
      expect(mockJwtService.verifyAccessToken).toHaveBeenCalledWith('valid_token');
      expect(mockUserModel.findById).toHaveBeenCalledWith('user_id');
      expect(mockRequest.user).toEqual(mockPayload);
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should return 401 for missing token', async () => {
      mockRequest.headers = {};

      mockJwtService.extractTokenFromHeader.mockReturnValue(null);

      await authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: 'Access token is required'
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 for invalid token', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid_token'
      };

      mockJwtService.extractTokenFromHeader.mockReturnValue('invalid_token');
      mockJwtService.verifyAccessToken.mockImplementation(() => {
        throw new Error('Invalid access token');
      });

      await authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'AUTHENTICATION_FAILED',
          message: 'Invalid access token'
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 for non-existent user', async () => {
      const mockPayload = {
        userId: 'user_id',
        username: 'testuser',
        email: 'test@example.com',
        role: 'TEAM_MEMBER' as const
      };

      mockRequest.headers = {
        authorization: 'Bearer valid_token'
      };

      mockJwtService.extractTokenFromHeader.mockReturnValue('valid_token');
      mockJwtService.verifyAccessToken.mockReturnValue(mockPayload);
      mockUserModel.findById.mockResolvedValue(null);

      await authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User no longer exists'
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('authorize middleware', () => {
    it('should allow access for authorized role', () => {
      mockRequest.user = {
        userId: 'user_id',
        username: 'testuser',
        email: 'test@example.com',
        role: 'CEO'
      };

      const authorizeMiddleware = authorize('CEO', 'MANAGER');
      authorizeMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should deny access for unauthorized role', () => {
      mockRequest.user = {
        userId: 'user_id',
        username: 'testuser',
        email: 'test@example.com',
        role: 'TEAM_MEMBER'
      };

      const authorizeMiddleware = authorize('CEO', 'MANAGER');
      authorizeMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Insufficient permissions to access this resource'
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should deny access for unauthenticated user', () => {
      delete mockRequest.user;

      const authorizeMiddleware = authorize('CEO');
      authorizeMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication is required'
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});