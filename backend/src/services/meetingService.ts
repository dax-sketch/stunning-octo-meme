import {
  MeetingModel,
  CreateMeetingData,
  UpdateMeetingData,
  MeetingWithDetails,
  AppwriteMeeting,
} from '../models/AppwriteMeeting';
import { CompanyModel } from '../models/AppwriteCompany';
import { UserModel } from '../models/AppwriteUser';

export class MeetingService {
  /**
   * Create a new meeting
   */
  async createMeeting(data: CreateMeetingData): Promise<MeetingWithDetails> {
    // Validate that company exists
    const company = await CompanyModel.findById(data.companyId);
    if (!company) {
      throw new Error('Company not found');
    }

    const meeting = await MeetingModel.create(data);
    return await this.populateMeetingDetails(meeting);
  }

  /**
   * Get meeting by ID
   */
  async getMeetingById(id: string): Promise<MeetingWithDetails | null> {
    const meeting = await MeetingModel.findById(id);
    if (!meeting) return null;

    const meetingWithDetails = await this.populateMeetingDetails(meeting);
    
    // Return null if company no longer exists
    if (meetingWithDetails.companyName === 'Unknown Company') return null;
    
    return meetingWithDetails;
  }

  /**
   * Get meetings with filtering
   */
  async getMeetings(
    filters: {
      companyId?: string;
      createdBy?: string;
      scheduledDateFrom?: Date;
      scheduledDateTo?: Date;
    } = {}
  ): Promise<MeetingWithDetails[]> {
    const meetings = await MeetingModel.findMany(filters);
    const meetingsWithDetails = await Promise.all(
      meetings.map((meeting) => this.populateMeetingDetails(meeting))
    );
    
    // Filter out meetings where company no longer exists
    return meetingsWithDetails.filter(meeting => meeting.companyName !== 'Unknown Company');
  }

  /**
   * Get upcoming meetings
   */
  async getUpcomingMeetings(days: number = 7): Promise<MeetingWithDetails[]> {
    const meetings = await MeetingModel.findUpcoming(days);
    const meetingsWithDetails = await Promise.all(
      meetings.map((meeting) => this.populateMeetingDetails(meeting))
    );
    
    // Filter out meetings where company no longer exists
    return meetingsWithDetails.filter(meeting => meeting.companyName !== 'Unknown Company');
  }

  /**
   * Update meeting
   */
  async updateMeeting(
    id: string,
    data: UpdateMeetingData
  ): Promise<MeetingWithDetails | null> {
    const existingMeeting = await MeetingModel.findById(id);
    if (!existingMeeting) {
      throw new Error('Meeting not found');
    }

    const updatedMeeting = await MeetingModel.update(id, data);
    return await this.populateMeetingDetails(updatedMeeting);
  }

  /**
   * Delete meeting
   */
  async deleteMeeting(id: string): Promise<boolean> {
    const existingMeeting = await MeetingModel.findById(id);
    if (!existingMeeting) {
      throw new Error('Meeting not found');
    }

    await MeetingModel.delete(id);
    return true;
  }

  /**
   * Get meetings for a specific company
   */
  async getMeetingsByCompany(companyId: string): Promise<MeetingWithDetails[]> {
    return await this.getMeetings({ companyId });
  }

  /**
   * Update RSVP response for a meeting
   */
  async updateRSVP(meetingId: string, userId: string, response: 'going' | 'not_going'): Promise<MeetingWithDetails> {
    const meeting = await MeetingModel.updateRSVP(meetingId, userId, response);
    return await this.populateMeetingDetails(meeting);
  }

  /**
   * Add meeting notes after the meeting
   */
  async addMeetingNotes(meetingId: string, notes: string): Promise<MeetingWithDetails> {
    const meeting = await MeetingModel.addMeetingNotes(meetingId, notes);
    return await this.populateMeetingDetails(meeting);
  }

  /**
   * Get all meetings for meeting history (including scheduled ones)
   */
  async getMeetingHistoryByCompany(companyId: string): Promise<MeetingWithDetails[]> {
    const meetings = await MeetingModel.findByCompanyForHistory(companyId);
    return await Promise.all(
      meetings.map((meeting) => this.populateMeetingDetails(meeting))
    );
  }

  /**
   * Get completed meetings for meeting history
   */
  async getCompletedMeetingsByCompany(companyId: string): Promise<MeetingWithDetails[]> {
    const meetings = await MeetingModel.findCompletedByCompany(companyId);
    return await Promise.all(
      meetings.map((meeting) => this.populateMeetingDetails(meeting))
    );
  }

  /**
   * Clean up orphaned meetings (meetings where company no longer exists)
   */
  async cleanupOrphanedMeetings(): Promise<{ deletedCount: number; deletedMeetingIds: string[] }> {
    const allMeetings = await MeetingModel.findMany({});
    const orphanedMeetings: string[] = [];

    for (const meeting of allMeetings) {
      const company = await CompanyModel.findById(meeting.companyId);
      if (!company) {
        orphanedMeetings.push(meeting.$id);
      }
    }

    // Delete orphaned meetings
    for (const meetingId of orphanedMeetings) {
      await MeetingModel.delete(meetingId);
    }

    console.log(`🧹 Cleaned up ${orphanedMeetings.length} orphaned meetings`);
    return { deletedCount: orphanedMeetings.length, deletedMeetingIds: orphanedMeetings };
  }

  /**
   * Populate meeting with company details
   */
  private async populateMeetingDetails(
    meeting: AppwriteMeeting
  ): Promise<MeetingWithDetails> {
    const company = await CompanyModel.findById(meeting.companyId);

    const result: MeetingWithDetails = {
      id: meeting.$id,
      companyId: meeting.companyId,
      companyName: company?.name || 'Unknown Company',
      scheduledDate: meeting.scheduledDate,
      duration: meeting.duration,
      attendees: JSON.parse(meeting.attendees || '[]'),
      createdBy: meeting.createdBy,
      status: meeting.status || 'scheduled',
      createdAt: meeting.$createdAt,
      updatedAt: meeting.$updatedAt,
    };

    // Add RSVP responses with user details if they exist
    if (meeting.rsvpResponses && meeting.rsvpResponses.trim()) {
      const rsvpResponses = JSON.parse(meeting.rsvpResponses);
      const rsvpWithUserDetails: any = {};
      
      // Get user details for each RSVP response
      for (const [userId, response] of Object.entries(rsvpResponses)) {
        const user = await UserModel.findById(userId);
        rsvpWithUserDetails[userId] = {
          response,
          username: user?.username || 'Unknown User',
          email: user?.email || ''
        };
      }
      
      result.rsvpResponses = rsvpResponses;
      result.rsvpDetails = rsvpWithUserDetails;
    }

    // Only add notes if it exists and is not empty
    if (meeting.notes && meeting.notes.trim()) {
      result.notes = meeting.notes;
    }

    // Add meeting notes if they exist
    if (meeting.meetingNotes && meeting.meetingNotes.trim()) {
      result.meetingNotes = meeting.meetingNotes;
    }

    return result;
  }
}
