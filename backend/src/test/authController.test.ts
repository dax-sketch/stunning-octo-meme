import request from 'supertest';
import express from 'express';
import { AuthController } from '../controllers/authController';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';

// Mock dependencies
jest.mock('../models/User');
jest.mock('../utils/jwt');

const { UserModel } = require('../models/User');
const { JwtService } = require('../utils/jwt');

// Create test app
const app = express();
app.use(express.json());

// Mock authenticate middleware for testing
const mockAuthenticate = (req: any, res: any, next: any) => {
    req.user = {
        userId: 'user_id',
        username: 'testuser',
        email: 'test@example.com',
        role: 'TEAM_MEMBER'
    };
    next();
};

// Setup routes
app.post('/auth/register', AuthController.register);
app.post('/auth/login', AuthController.login);
app.post('/auth/refresh', AuthController.refresh);
app.get('/auth/profile', mockAuthenticate, AuthController.getProfile);
app.post('/auth/logout', AuthController.logout);

describe('AuthController', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /auth/register', () => {
        it('should register user successfully', async () => {
            const userData = {
                username: 'testuser',
                email: 'test@example.com',
                phoneNumber: '+1234567890',
                password: 'TestPassword123'
            };

            const createdUser = {
                id: 'user_id',
                username: 'testuser',
                email: 'test@example.com',
                phoneNumber: '+1234567890',
                role: 'TEAM_MEMBER'
            };

            const tokenPair = {
                accessToken: 'access_token',
                refreshToken: 'refresh_token'
            };

            UserModel.create.mockResolvedValue(createdUser);
            JwtService.generateTokenPair.mockReturnValue(tokenPair);

            const response = await request(app)
                .post('/auth/register')
                .send(userData);

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.user).toEqual(createdUser);
            expect(response.body.data.tokens).toEqual(tokenPair);
            expect(UserModel.create).toHaveBeenCalledWith(userData);
        });

        it('should return 400 for validation error', async () => {
            const userData = {
                username: 'testuser',
                email: 'invalid-email',
                phoneNumber: '+1234567890',
                password: 'TestPassword123'
            };

            UserModel.create.mockRejectedValue(new Error('Validation error: Invalid email'));

            const response = await request(app)
                .post('/auth/register')
                .send(userData);

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('VALIDATION_ERROR');
        });

        it('should return 409 for existing user', async () => {
            const userData = {
                username: 'existinguser',
                email: 'test@example.com',
                phoneNumber: '+1234567890',
                password: 'TestPassword123'
            };

            UserModel.create.mockRejectedValue(new Error('Username already exists'));

            const response = await request(app)
                .post('/auth/register')
                .send(userData);

            expect(response.status).toBe(409);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('USER_EXISTS');
        });
    });

    describe('POST /auth/login', () => {
        it('should login user successfully', async () => {
            const credentials = {
                username: 'testuser',
                password: 'TestPassword123'
            };

            const user = {
                id: 'user_id',
                username: 'testuser',
                email: 'test@example.com',
                role: 'TEAM_MEMBER'
            };

            const tokenPair = {
                accessToken: 'access_token',
                refreshToken: 'refresh_token'
            };

            UserModel.authenticate.mockResolvedValue(user);
            JwtService.generateTokenPair.mockReturnValue(tokenPair);

            const response = await request(app)
                .post('/auth/login')
                .send(credentials);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.user).toEqual(user);
            expect(response.body.data.tokens).toEqual(tokenPair);
        });

        it('should return 401 for invalid credentials', async () => {
            const credentials = {
                username: 'testuser',
                password: 'WrongPassword'
            };

            UserModel.authenticate.mockResolvedValue(null);

            const response = await request(app)
                .post('/auth/login')
                .send(credentials);

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
        });
    });

    describe('POST /auth/refresh', () => {
        it('should refresh token successfully', async () => {
            const refreshToken = 'valid_refresh_token';
            const user = {
                id: 'user_id',
                username: 'testuser',
                email: 'test@example.com',
                role: 'TEAM_MEMBER'
            };

            const newTokenPair = {
                accessToken: 'new_access_token',
                refreshToken: 'new_refresh_token'
            };

            JwtService.verifyRefreshToken.mockReturnValue({ userId: 'user_id' });
            UserModel.findById.mockResolvedValue(user);
            JwtService.generateTokenPair.mockReturnValue(newTokenPair);

            const response = await request(app)
                .post('/auth/refresh')
                .send({ refreshToken });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.tokens).toEqual(newTokenPair);
        });

        it('should return 400 for missing refresh token', async () => {
            const response = await request(app)
                .post('/auth/refresh')
                .send({});

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('MISSING_REFRESH_TOKEN');
        });

        it('should return 401 for invalid refresh token', async () => {
            const refreshToken = 'invalid_refresh_token';

            JwtService.verifyRefreshToken.mockImplementation(() => {
                throw new Error('Invalid refresh token');
            });

            const response = await request(app)
                .post('/auth/refresh')
                .send({ refreshToken });

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('TOKEN_REFRESH_FAILED');
        });
    });

    describe('POST /auth/logout', () => {
        it('should logout successfully', async () => {
            const response = await request(app)
                .post('/auth/logout');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Logout successful');
        });
    });
});