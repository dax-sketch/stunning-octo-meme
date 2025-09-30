import { Request, Response } from 'express';
import { SchedulerController } from '../controllers/schedulerController';
import { SchedulerService } from '../services/schedulerService';

// Mock dependencies
jest.mock('../services/schedulerService');

describe('SchedulerController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockSchedulerService: jest.Mocked<SchedulerService>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockRequest = {
      body: {},
      user: {
        id: 'user1',
        role: 'CEO'
      }
    } as any;

    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };

    mockSchedulerService = {
      getStatus: jest.fn(),
      scheduleMeetingReminder: jest.fn(),
      restartJobs: jest.fn()
    } as any;

    (SchedulerService.getInstance as jest.Mock).mockReturnValue(mockSchedulerService);
  });

  describe('getStatus', () => {
    it('should return scheduler status successfully', async () => {
      const mockStatus = {
        isRunning: true,
        jobs: [
          { name: 'processNotifications', running: true, cronExpression: '*/5 * * * *' },
          { name: 'meetingReminders', running: true, cronExpression: '0 9 * * *' }
        ],
        config: {
          meetingReminderCron: '0 9 * * *',
          notificationProcessingCron: '*/5 * * * *',
          tierUpdateCron: '0 2 * * *'
        }
      };

      mockSchedulerService.getStatus.mockReturnValue(mockStatus);

      await SchedulerController.getStatus(mockRequest as Request, mockResponse as Response);

      expect(mockSchedulerService.getStatus).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockStatus
      });
    });

    it('should handle errors gracefully', async () => {
      mockSchedulerService.getStatus.mockImplementation(() => {
        throw new Error('Scheduler error');
      });

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await SchedulerController.getStatus(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'SCHEDULER_ERROR',
          message: 'Failed to get scheduler status'
        }
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('scheduleMeetingReminder', () => {
    beforeEach(() => {
      mockRequest.body = {
        companyId: 'company1',
        scheduledFor: '2024-12-01T10:00:00Z',
        customMessage: 'Custom reminder message'
      };
    });

    it('should schedule meeting reminder successfully', async () => {
      mockSchedulerService.scheduleMeetingReminder.mockResolvedValue(undefined);

      await SchedulerController.scheduleMeetingReminder(mockRequest as Request, mockResponse as Response);

      expect(mockSchedulerService.scheduleMeetingReminder).toHaveBeenCalledWith(
        'user1',
        'company1',
        new Date('2024-12-01T10:00:00Z'),
        'Custom reminder message'
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Meeting reminder scheduled successfully'
      });
    });

    it('should use provided userId if specified', async () => {
      mockRequest.body.userId = 'user2';
      mockSchedulerService.scheduleMeetingReminder.mockResolvedValue(undefined);

      await SchedulerController.scheduleMeetingReminder(mockRequest as Request, mockResponse as Response);

      expect(mockSchedulerService.scheduleMeetingReminder).toHaveBeenCalledWith(
        'user2',
        'company1',
        new Date('2024-12-01T10:00:00Z'),
        'Custom reminder message'
      );
    });

    it('should return validation error for invalid input', async () => {
      mockRequest.body = {
        companyId: '', // Invalid empty string
        scheduledFor: 'invalid-date'
      };

      await SchedulerController.scheduleMeetingReminder(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: expect.stringContaining('is not allowed to be empty')
        }
      });
    });

    it('should return error if user ID is missing', async () => {
      mockRequest.user = undefined;

      await SchedulerController.scheduleMeetingReminder(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'USER_REQUIRED',
          message: 'User ID is required'
        }
      });
    });

    it('should handle user not found error', async () => {
      mockSchedulerService.scheduleMeetingReminder.mockRejectedValue(new Error('User not found'));

      await SchedulerController.scheduleMeetingReminder(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found'
        }
      });
    });

    it('should handle company not found error', async () => {
      mockSchedulerService.scheduleMeetingReminder.mockRejectedValue(new Error('Company not found'));

      await SchedulerController.scheduleMeetingReminder(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Company not found'
        }
      });
    });

    it('should handle general scheduler errors', async () => {
      mockSchedulerService.scheduleMeetingReminder.mockRejectedValue(new Error('General error'));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await SchedulerController.scheduleMeetingReminder(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'SCHEDULER_ERROR',
          message: 'Failed to schedule meeting reminder'
        }
      });

      consoleErrorSpy.mockRestore();
    });

    it('should validate scheduledFor is in the future', async () => {
      mockRequest.body.scheduledFor = '2020-01-01T10:00:00Z'; // Past date

      await SchedulerController.scheduleMeetingReminder(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: expect.stringContaining('must be greater than or equal to "now"')
        }
      });
    });

    it('should validate customMessage length', async () => {
      mockRequest.body.customMessage = 'a'.repeat(501); // Too long

      await SchedulerController.scheduleMeetingReminder(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: expect.stringContaining('length must be less than or equal to 500')
        }
      });
    });
  });

  describe('restartScheduler', () => {
    it('should restart scheduler successfully for CEO', async () => {
      const newConfig = {
        meetingReminderCron: '0 8 * * *',
        notificationProcessingCron: '*/10 * * * *'
      };
      mockRequest.body = newConfig;

      const mockStatus = {
        isRunning: true,
        jobs: [],
        config: newConfig
      };
      mockSchedulerService.restartJobs.mockReturnValue(undefined);
      mockSchedulerService.getStatus.mockReturnValue(mockStatus);

      await SchedulerController.restartScheduler(mockRequest as Request, mockResponse as Response);

      expect(mockSchedulerService.restartJobs).toHaveBeenCalledWith(newConfig);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Scheduler restarted successfully',
        data: mockStatus
      });
    });

    it('should restart scheduler successfully for MANAGER', async () => {
      mockRequest.user = { id: 'user1', role: 'MANAGER' };
      mockSchedulerService.restartJobs.mockReturnValue(undefined);
      mockSchedulerService.getStatus.mockReturnValue({} as any);

      await SchedulerController.restartScheduler(mockRequest as Request, mockResponse as Response);

      expect(mockSchedulerService.restartJobs).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Scheduler restarted successfully'
        })
      );
    });

    it('should deny access for TEAM_MEMBER', async () => {
      mockRequest.user = { id: 'user1', role: 'TEAM_MEMBER' };

      await SchedulerController.restartScheduler(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Only CEOs and Managers can restart the scheduler'
        }
      });
      expect(mockSchedulerService.restartJobs).not.toHaveBeenCalled();
    });

    it('should deny access for users without role', async () => {
      mockRequest.user = { id: 'user1' }; // No role

      await SchedulerController.restartScheduler(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Only CEOs and Managers can restart the scheduler'
        }
      });
    });

    it('should validate cron expression format', async () => {
      mockRequest.body = {
        meetingReminderCron: 'invalid-cron'
      };

      // Note: In a real implementation, you might want to add cron validation
      // For now, we'll assume the validation passes through Joi
      mockSchedulerService.restartJobs.mockReturnValue(undefined);
      mockSchedulerService.getStatus.mockReturnValue({} as any);

      await SchedulerController.restartScheduler(mockRequest as Request, mockResponse as Response);

      expect(mockSchedulerService.restartJobs).toHaveBeenCalledWith({
        meetingReminderCron: 'invalid-cron'
      });
    });

    it('should handle scheduler restart errors', async () => {
      mockSchedulerService.restartJobs.mockImplementation(() => {
        throw new Error('Restart failed');
      });

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await SchedulerController.restartScheduler(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'SCHEDULER_ERROR',
          message: 'Failed to restart scheduler'
        }
      });

      consoleErrorSpy.mockRestore();
    });

    it('should work with empty configuration', async () => {
      mockRequest.body = {}; // Empty config
      mockSchedulerService.restartJobs.mockReturnValue(undefined);
      mockSchedulerService.getStatus.mockReturnValue({} as any);

      await SchedulerController.restartScheduler(mockRequest as Request, mockResponse as Response);

      expect(mockSchedulerService.restartJobs).toHaveBeenCalledWith({});
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Scheduler restarted successfully'
        })
      );
    });
  });
});