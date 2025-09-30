import { JwtService } from '../utils/jwt';

// Mock Prisma Client
const mockPrisma = {
  user: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
  },
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => mockPrisma),
}));

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

const bcrypt = require('bcryptjs');

// Import after mocking
import { UserModel, CreateUserData, LoginCredentials } from '../models/User';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { describe } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';

describe('Authentication System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('UserModel', () => {
    describe('hashPassword', () => {
      it('should hash password correctly', async () => {
        const password = 'TestPassword123';
        const hashedPassword = 'hashed_password';
        
        bcrypt.hash.mockResolvedValue(hashedPassword);
        
        const result = await UserModel.hashPassword(password);
        
        expect(bcrypt.hash).toHaveBeenCalledWith(password, 12);
        expect(result).toBe(hashedPassword);
      });
    });

    describe('verifyPassword', () => {
      it('should verify password correctly', async () => {
        const password = 'TestPassword123';
        const hashedPassword = 'hashed_password';
        
        bcrypt.compare.mockResolvedValue(true);
        
        const result = await UserModel.verifyPassword(password, hashedPassword);
        
        expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
        expect(result).toBe(true);
      });

      it('should return false for incorrect password', async () => {
        const password = 'WrongPassword';
        const hashedPassword = 'hashed_password';
        
        bcrypt.compare.mockResolvedValue(false);
        
        const result = await UserModel.verifyPassword(password, hashedPassword);
        
        expect(result).toBe(false);
      });
    });

    describe('create', () => {
      it('should create user successfully with valid data', async () => {
        const userData: CreateUserData = {
          username: 'testuser',
          email: 'test@example.com',
          phoneNumber: '+1234567890',
          password: 'TestPassword123',
          role: 'TEAM_MEMBER'
        };

        const hashedPassword = 'hashed_password';
        const createdUser = {
          id: 'user_id',
          ...userData,
          password: hashedPassword,
          emailNotifications: true,
          smsNotifications: true,
          meetingReminders: true,
          auditReminders: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        // Mock Prisma calls
        mockPrisma.user.findFirst.mockResolvedValue(null); // No existing user
        mockPrisma.user.create.mockResolvedValue(createdUser);
        bcrypt.hash.mockResolvedValue(hashedPassword);

        const result = await UserModel.create(userData);

        expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
          where: {
            OR: [
              { username: userData.username },
              { email: userData.email }
            ]
          }
        });
        expect(mockPrisma.user.create).toHaveBeenCalledWith({
          data: {
            ...userData,
            password: hashedPassword
          }
        });
        expect(result).not.toHaveProperty('password');
        expect(result.username).toBe(userData.username);
      });

      it('should throw error for invalid email', async () => {
        const userData: CreateUserData = {
          username: 'testuser',
          email: 'invalid-email',
          phoneNumber: '+1234567890',
          password: 'TestPassword123'
        };

        await expect(UserModel.create(userData)).rejects.toThrow('Validation error');
      });

      it('should throw error for weak password', async () => {
        const userData: CreateUserData = {
          username: 'testuser',
          email: 'test@example.com',
          phoneNumber: '+1234567890',
          password: 'weak'
        };

        await expect(UserModel.create(userData)).rejects.toThrow('Validation error');
      });

      it('should throw error for existing username', async () => {
        const userData: CreateUserData = {
          username: 'existinguser',
          email: 'test@example.com',
          phoneNumber: '+1234567890',
          password: 'TestPassword123'
        };

        const existingUser = {
          id: 'existing_id',
          username: 'existinguser',
          email: 'other@example.com'
        };

        mockPrisma.user.findFirst.mockResolvedValue(existingUser);

        await expect(UserModel.create(userData)).rejects.toThrow('Username already exists');
      });
    });

    describe('authenticate', () => {
      it('should authenticate user with correct credentials', async () => {
        const credentials: LoginCredentials = {
          username: 'testuser',
          password: 'TestPassword123'
        };

        const user = {
          id: 'user_id',
          username: 'testuser',
          email: 'test@example.com',
          password: 'hashed_password',
          role: 'TEAM_MEMBER',
          phoneNumber: '+1234567890',
          emailNotifications: true,
          smsNotifications: true,
          meetingReminders: true,
          auditReminders: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        mockPrisma.user.findUnique.mockResolvedValue(user);
        bcrypt.compare.mockResolvedValue(true);

        const result = await UserModel.authenticate(credentials);

        expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
          where: { username: credentials.username }
        });
        expect(bcrypt.compare).toHaveBeenCalledWith(credentials.password, user.password);
        expect(result).not.toHaveProperty('password');
        expect(result?.username).toBe(credentials.username);
      });

      it('should return null for non-existent user', async () => {
        const credentials: LoginCredentials = {
          username: 'nonexistent',
          password: 'TestPassword123'
        };

        mockPrisma.user.findUnique.mockResolvedValue(null);

        const result = await UserModel.authenticate(credentials);

        expect(result).toBeNull();
      });

      it('should return null for incorrect password', async () => {
        const credentials: LoginCredentials = {
          username: 'testuser',
          password: 'WrongPassword'
        };

        const user = {
          id: 'user_id',
          username: 'testuser',
          password: 'hashed_password'
        };

        mockPrisma.user.findUnique.mockResolvedValue(user);
        bcrypt.compare.mockResolvedValue(false);

        const result = await UserModel.authenticate(credentials);

        expect(result).toBeNull();
      });
    });
  });

  describe('JwtService', () => {
    const mockPayload = {
      userId: 'user_id',
      username: 'testuser',
      email: 'test@example.com',
      role: 'TEAM_MEMBER' as const
    };

    describe('generateTokenPair', () => {
      it('should generate access and refresh tokens', () => {
        const tokenPair = JwtService.generateTokenPair(mockPayload);

        expect(tokenPair).toHaveProperty('accessToken');
        expect(tokenPair).toHaveProperty('refreshToken');
        expect(typeof tokenPair.accessToken).toBe('string');
        expect(typeof tokenPair.refreshToken).toBe('string');
      });
    });

    describe('verifyAccessToken', () => {
      it('should verify valid access token', () => {
        const token = JwtService.generateAccessToken(mockPayload);
        const decoded = JwtService.verifyAccessToken(token);

        expect(decoded.userId).toBe(mockPayload.userId);
        expect(decoded.username).toBe(mockPayload.username);
        expect(decoded.email).toBe(mockPayload.email);
        expect(decoded.role).toBe(mockPayload.role);
      });

      it('should throw error for invalid token', () => {
        const invalidToken = 'invalid.token.here';

        expect(() => {
          JwtService.verifyAccessToken(invalidToken);
        }).toThrow('Invalid access token');
      });
    });

    describe('extractTokenFromHeader', () => {
      it('should extract token from valid Bearer header', () => {
        const token = 'valid.jwt.token';
        const header = `Bearer ${token}`;

        const extracted = JwtService.extractTokenFromHeader(header);

        expect(extracted).toBe(token);
      });

      it('should return null for invalid header format', () => {
        const invalidHeader = 'InvalidFormat token';

        const extracted = JwtService.extractTokenFromHeader(invalidHeader);

        expect(extracted).toBeNull();
      });

      it('should return null for undefined header', () => {
        const extracted = JwtService.extractTokenFromHeader(undefined);

        expect(extracted).toBeNull();
      });
    });
  });
});