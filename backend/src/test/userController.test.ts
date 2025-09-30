import request from 'supertest';
import app from '../server';
import { UserModel } from '../models/User';
import { JwtService } from '../utils/jwt';

// Mock the UserModel
jest.mock('../models/User');
jest.mock('../services/emailService');
jest.mock('../services/smsService');

const mockUserModel = UserModel as jest.Mocked<typeof UserModel>;

describe('UserController', () => {
  let authToken: string;
  let mockUser: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create mock user
    mockUser = {
      id: 'user-123',
      username: 'testuser',
      email: 'test@example.com',
      phoneNumber: '+1234567890',
      role: 'TEAM_MEMBER',
      emailNotifications: true,
      smsNotifications: true,
      meetingReminders: true,
      auditReminders: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Generate auth token
    authToken = JwtService.generateAccessToken({
      userId: mockUser.id,
      username: mockUser.username,
      email: mockUser.email,
      role: mockUser.role
    });
  });

  describe('PUT /api/users/profile', () => {
    it('should update user profile successfully', async () => {
      const updateData = {
        username: 'newusername',
        email: 'newemail@example.com'
      };

      const updatedUser = { ...mockUser, ...updateData };
      mockUserModel.findByUsername.mockResolvedValue(null);
      mockUserModel.findByEmail.mockResolvedValue(null);
      mockUserModel.update.mockResolvedValue(updatedUser);

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.username).toBe(updateData.username);
      expect(response.body.data.user.email).toBe(updateData.email);
      expect(mockUserModel.update).toHaveBeenCalledWith(mockUser.id, updateData);
    });

    it('should return 401 if not authenticated', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .send({ username: 'newusername' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTHENTICATION_REQUIRED');
    });

    it('should return 400 for invalid input', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ username: 'ab' }); // Too short

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 409 if username already exists', async () => {
      const updateData = { username: 'existinguser' };
      const existingUser = { ...mockUser, id: 'different-id', username: 'existinguser' };
      
      mockUserModel.findByUsername.mockResolvedValue(existingUser);

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('USERNAME_EXISTS');
    });

    it('should validate password strength', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ password: 'weak' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Password must contain');
    });
  });

  describe('PUT /api/users/notification-preferences', () => {
    it('should update notification preferences successfully', async () => {
      const preferences = {
        emailNotifications: false,
        smsNotifications: true,
        meetingReminders: false,
        auditReminders: true
      };

      const updatedUser = { ...mockUser, ...preferences };
      mockUserModel.update.mockResolvedValue(updatedUser);

      const response = await request(app)
        .put('/api/users/notification-preferences')
        .set('Authorization', `Bearer ${authToken}`)
        .send(preferences);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.preferences.emailNotifications).toBe(false);
      expect(response.body.data.preferences.smsNotifications).toBe(true);
      expect(mockUserModel.update).toHaveBeenCalledWith(mockUser.id, preferences);
    });

    it('should return 401 if not authenticated', async () => {
      const response = await request(app)
        .put('/api/users/notification-preferences')
        .send({ emailNotifications: false });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should validate preference types', async () => {
      const response = await request(app)
        .put('/api/users/notification-preferences')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ emailNotifications: 'invalid' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/users/test-notification', () => {
    beforeEach(() => {
      // Mock the dynamic imports
      jest.doMock('../services/emailService', () => ({
        EmailService: {
          sendEmail: jest.fn().mockResolvedValue(true)
        }
      }));
      
      jest.doMock('../services/smsService', () => ({
        SMSService: {
          sendSMS: jest.fn().mockResolvedValue(true)
        }
      }));
    });

    it('should send test email notification', async () => {
      mockUserModel.findById.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/users/test-notification')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ type: 'email' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.results.email).toBe(true);
    });

    it('should send test SMS notification', async () => {
      mockUserModel.findById.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/users/test-notification')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ type: 'sms' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.results.sms).toBe(true);
    });

    it('should send both test notifications', async () => {
      mockUserModel.findById.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/users/test-notification')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ type: 'both' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.results.email).toBe(true);
      expect(response.body.data.results.sms).toBe(true);
    });

    it('should return 401 if not authenticated', async () => {
      const response = await request(app)
        .post('/api/users/test-notification')
        .send({ type: 'email' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should validate notification type', async () => {
      const response = await request(app)
        .post('/api/users/test-notification')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ type: 'invalid' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 404 if user not found', async () => {
      mockUserModel.findById.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/users/test-notification')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ type: 'email' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('USER_NOT_FOUND');
    });
  });
});