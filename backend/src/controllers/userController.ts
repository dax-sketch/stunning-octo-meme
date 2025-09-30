import { Request, Response } from 'express';
import { UserModel } from '../models/AppwriteUser';
import Joi from 'joi';

export class UserController {
  // Get all users (for audit assignment)
  static async getUsers(req: Request, res: Response): Promise<void> {
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

      const { users } = await UserModel.findMany();
      
      // Return only necessary fields for audit assignment
      const userList = users.map(user => ({
        id: user.$id,
        username: user.username,
        email: user.email,
        role: user.role,
      }));

      res.status(200).json({
        success: true,
        data: userList,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch users';
      
      res.status(500).json({
        success: false,
        error: {
          code: 'USERS_FETCH_FAILED',
          message: errorMessage
        }
      });
    }
  }

  // Update user profile
  static async updateProfile(req: Request, res: Response): Promise<void> {
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

      const updateData = req.body;
      const userId = req.user.userId;

      // Validation schema for profile updates
      const updateProfileSchema = Joi.object({
        username: Joi.string().alphanum().min(3).max(30).optional(),
        email: Joi.string().email().optional(),
        phoneNumber: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).min(10).optional(),
        password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).optional()
          .messages({
            'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
          })
      });

      const { error, value } = updateProfileSchema.validate(updateData);
      if (error) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.details[0]?.message || 'Invalid input'
          }
        });
        return;
      }

      // Check if username or email already exists (if being updated)
      if (value.username || value.email) {
        const existingUser = await UserModel.findByUsername(value.username || '');
        const existingEmailUser = await UserModel.findByEmail(value.email || '');
        
        if (existingUser && existingUser.$id !== userId) {
          res.status(409).json({
            success: false,
            error: {
              code: 'USERNAME_EXISTS',
              message: 'Username already exists'
            }
          });
          return;
        }

        if (existingEmailUser && existingEmailUser.$id !== userId) {
          res.status(409).json({
            success: false,
            error: {
              code: 'EMAIL_EXISTS',
              message: 'Email already exists'
            }
          });
          return;
        }
      }

      const updatedUser = await UserModel.update(userId, value);

      res.status(200).json({
        success: true,
        data: { user: updatedUser },
        message: 'Profile updated successfully'
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      
      res.status(500).json({
        success: false,
        error: {
          code: 'PROFILE_UPDATE_FAILED',
          message: errorMessage
        }
      });
    }
  }

  // Update notification preferences
  static async updateNotificationPreferences(req: Request, res: Response): Promise<void> {
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

      const preferences = req.body;
      const userId = req.user.userId;

      // Validation schema for notification preferences
      const preferencesSchema = Joi.object({
        emailNotifications: Joi.boolean().optional(),
        smsNotifications: Joi.boolean().optional(),
        meetingReminders: Joi.boolean().optional(),
        auditReminders: Joi.boolean().optional()
      });

      const { error, value } = preferencesSchema.validate(preferences);
      if (error) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.details[0]?.message || 'Invalid preferences'
          }
        });
        return;
      }

      const updatedUser = await UserModel.update(userId, value);

      res.status(200).json({
        success: true,
        data: { 
          user: updatedUser,
          preferences: {
            // DISABLED FOR NOW - Notification preferences
            emailNotifications: false, // updatedUser.emailNotifications,
            smsNotifications: false, // updatedUser.smsNotifications,
            meetingReminders: false, // updatedUser.meetingReminders,
            auditReminders: false // updatedUser.auditReminders
          }
        },
        message: 'Notification preferences updated successfully'
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update notification preferences';
      
      res.status(500).json({
        success: false,
        error: {
          code: 'PREFERENCES_UPDATE_FAILED',
          message: errorMessage
        }
      });
    }
  }

  // Test notification functionality
  static async testNotification(req: Request, res: Response): Promise<void> {
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

      const { type } = req.body;
      const userId = req.user.userId;

      // Validation schema for test notification
      const testSchema = Joi.object({
        type: Joi.string().valid('email', 'sms', 'both').required()
      });

      const { error, value } = testSchema.validate({ type });
      if (error) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.details[0]?.message || 'Invalid notification type'
          }
        });
        return;
      }

      // Get user details
      const user = await UserModel.findById(userId);
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

      // Import notification services
      const { EmailService } = await import('../services/emailService');
      const { SMSService } = await import('../services/smsService');

      const results: { email?: boolean; sms?: boolean } = {};

      // DISABLED FOR NOW - Send test notifications based on type
      if (value.type === 'email' || value.type === 'both') {
        // if (user.emailNotifications) {
        //   try {
        //     await EmailService.sendEmail({
        //       to: user.email,
        //       subject: 'Test Notification - Client Management Platform',
        //       text: 'This is a test notification to verify your email settings are working correctly.'
        //     });
        //     results.email = true;
        //   } catch (emailError) {
        //     results.email = false;
        //   }
        // } else {
          results.email = false;
        // }
      }

      if (value.type === 'sms' || value.type === 'both') {
        // if (user.smsNotifications) {
        //   try {
        //     await SMSService.sendSMS({
        //       to: user.phoneNumber,
        //       message: 'Test notification from Client Management Platform. Your SMS settings are working correctly.'
        //     });
        //     results.sms = true;
        //   } catch (smsError) {
        //     results.sms = false;
        //   }
        // } else {
          results.sms = false;
        // }
      }

      res.status(200).json({
        success: true,
        data: { results },
        message: 'Test notification sent'
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send test notification';
      
      res.status(500).json({
        success: false,
        error: {
          code: 'TEST_NOTIFICATION_FAILED',
          message: errorMessage
        }
      });
    }
  }
}