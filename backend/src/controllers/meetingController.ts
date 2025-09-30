import { Request, Response } from 'express';
import { MeetingService } from '../services/meetingService';
import { JwtPayload } from '../utils/jwt';

interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export class MeetingController {
  private meetingService: MeetingService;

  constructor() {
    this.meetingService = new MeetingService();
  }

  /**
   * Create a new meeting
   */
  createMeeting = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { companyId, scheduledDate, duration, attendees, notes } = req.body;
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

      if (!companyId || !scheduledDate || !duration || !attendees) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Missing required fields: companyId, scheduledDate, duration, attendees',
          },
        });
        return;
      }

      // Validate attendees array
      if (!Array.isArray(attendees) || attendees.length === 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Attendees must be a non-empty array',
          },
        });
        return;
      }

      // Validate scheduled date is in the future
      const meetingDate = new Date(scheduledDate);
      if (meetingDate <= new Date()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Meeting must be scheduled for a future date',
          },
        });
        return;
      }

      const meeting = await this.meetingService.createMeeting({
        companyId,
        scheduledDate: meetingDate,
        duration: parseInt(duration),
        attendees,
        notes,
        createdBy: userId,
      });

      res.status(201).json({
        success: true,
        data: meeting,
      });
    } catch (error: any) {
      console.error('Error creating meeting:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to create meeting',
        },
      });
    }
  };

  /**
   * Get all meetings
   */
  getMeetings = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { companyId, scheduledDateFrom, scheduledDateTo } = req.query;
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

      const filters: any = {};
      if (companyId) filters.companyId = companyId as string;
      if (scheduledDateFrom) filters.scheduledDateFrom = new Date(scheduledDateFrom as string);
      if (scheduledDateTo) filters.scheduledDateTo = new Date(scheduledDateTo as string);

      const meetings = await this.meetingService.getMeetings(filters);

      res.json({
        success: true,
        data: meetings,
      });
    } catch (error: any) {
      console.error('Error fetching meetings:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to fetch meetings',
        },
      });
    }
  };

  /**
   * Get upcoming meetings
   */
  getUpcomingMeetings = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { days = '7' } = req.query;
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

      const daysNum = parseInt(days as string);
      const meetings = await this.meetingService.getUpcomingMeetings(daysNum);

      res.json({
        success: true,
        data: meetings,
      });
    } catch (error: any) {
      console.error('Error fetching upcoming meetings:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to fetch upcoming meetings',
        },
      });
    }
  };

  /**
   * Get meeting by ID
   */
  getMeetingById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
            message: 'Meeting ID is required',
          },
        });
        return;
      }

      const meeting = await this.meetingService.getMeetingById(id);
      if (!meeting) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Meeting not found',
          },
        });
        return;
      }

      res.json({
        success: true,
        data: meeting,
      });
    } catch (error: any) {
      console.error('Error fetching meeting:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to fetch meeting',
        },
      });
    }
  };

  /**
   * Update meeting
   */
  updateMeeting = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { scheduledDate, duration, attendees, notes } = req.body;
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
            message: 'Meeting ID is required',
          },
        });
        return;
      }

      const updateData: any = {};
      if (scheduledDate) {
        const meetingDate = new Date(scheduledDate);
        if (meetingDate <= new Date()) {
          res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Meeting must be scheduled for a future date',
            },
          });
          return;
        }
        updateData.scheduledDate = meetingDate;
      }
      if (duration !== undefined) updateData.duration = parseInt(duration);
      if (attendees) updateData.attendees = attendees;
      if (notes !== undefined) updateData.notes = notes;

      const meeting = await this.meetingService.updateMeeting(id, updateData);
      if (!meeting) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Meeting not found',
          },
        });
        return;
      }

      res.json({
        success: true,
        data: meeting,
      });
    } catch (error: any) {
      console.error('Error updating meeting:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to update meeting',
        },
      });
    }
  };

  /**
   * Delete meeting
   */
  deleteMeeting = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
            message: 'Meeting ID is required',
          },
        });
        return;
      }

      await this.meetingService.deleteMeeting(id);

      res.json({
        success: true,
        message: 'Meeting deleted successfully',
      });
    } catch (error: any) {
      console.error('Error deleting meeting:', error);
      
      if (error.message === 'Meeting not found') {
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
          message: error.message || 'Failed to delete meeting',
        },
      });
    }
  };

  /**
   * Update RSVP response for a meeting
   */
  updateRSVP = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { response } = req.body;
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

      if (!id || !response) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Meeting ID and response are required',
          },
        });
        return;
      }

      if (!['going', 'not_going'].includes(response)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Response must be "going" or "not_going"',
          },
        });
        return;
      }

      const meeting = await this.meetingService.updateRSVP(id, userId, response);

      res.json({
        success: true,
        data: meeting,
      });
    } catch (error: any) {
      console.error('Error updating RSVP:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to update RSVP',
        },
      });
    }
  };

  /**
   * Add meeting notes
   */
  addMeetingNotes = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { notes } = req.body;
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

      if (!id || !notes) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Meeting ID and notes are required',
          },
        });
        return;
      }

      const meeting = await this.meetingService.addMeetingNotes(id, notes);

      res.json({
        success: true,
        data: meeting,
      });
    } catch (error: any) {
      console.error('Error adding meeting notes:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to add meeting notes',
        },
      });
    }
  };

  /**
   * Get completed meetings for a company
   */
  getCompletedMeetings = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { companyId } = req.params;
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

      if (!companyId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Company ID is required',
          },
        });
        return;
      }

      const meetings = await this.meetingService.getMeetingHistoryByCompany(companyId);

      res.json({
        success: true,
        data: meetings,
      });
    } catch (error: any) {
      console.error('Error fetching completed meetings:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to fetch completed meetings',
        },
      });
    }
  };
}