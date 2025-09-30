import { databases, COLLECTIONS, generateId } from '../config/appwrite';
import { Query } from 'appwrite';

export interface AppwriteMeeting {
  $id: string;
  companyId: string;
  scheduledDate: string;
  duration: number; // in minutes
  attendees: string; // JSON string array
  notes?: string;
  createdBy: string;
  rsvpResponses?: string; // JSON string of user responses {userId: 'going'|'not_going'}
  meetingNotes?: string; // Notes added after the meeting
  status?: string; // 'scheduled' | 'in_progress' | 'completed'
  $createdAt: string;
  $updatedAt: string;
}

export interface CreateMeetingData {
  companyId: string;
  scheduledDate: Date;
  duration: number;
  attendees: string[];
  notes?: string;
  createdBy: string;
}

export interface UpdateMeetingData {
  scheduledDate?: Date;
  duration?: number;
  attendees?: string[];
  notes?: string;
}

export interface MeetingWithDetails extends Omit<AppwriteMeeting, '$id' | '$createdAt' | '$updatedAt' | 'attendees' | 'rsvpResponses'> {
  id: string;
  companyName: string;
  attendees: string[];
  rsvpResponses?: { [userId: string]: 'going' | 'not_going' };
  rsvpDetails?: { [userId: string]: { response: 'going' | 'not_going', username: string, email: string } };
  createdAt: string;
  updatedAt: string;
}

export class MeetingModel {
  private static databaseId = process.env.APPWRITE_DATABASE_ID || 'client-management';
  private static collectionId = COLLECTIONS.MEETINGS;

  /**
   * Create a new meeting
   */
  static async create(data: CreateMeetingData): Promise<AppwriteMeeting> {
    const meetingData = {
      companyId: data.companyId,
      scheduledDate: data.scheduledDate.toISOString(),
      duration: data.duration,
      attendees: JSON.stringify(data.attendees),
      notes: data.notes || '',
      createdBy: data.createdBy,
    };

    return await databases.createDocument(
      this.databaseId,
      this.collectionId,
      generateId(),
      meetingData
    ) as unknown as AppwriteMeeting;
  }

  /**
   * Find meeting by ID
   */
  static async findById(id: string): Promise<AppwriteMeeting | null> {
    try {
      return await databases.getDocument(
        this.databaseId,
        this.collectionId,
        id
      ) as unknown as AppwriteMeeting;
    } catch (error: any) {
      if (error.code === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Find meetings with filters
   */
  static async findMany(filters: {
    companyId?: string;
    createdBy?: string;
    scheduledDateFrom?: Date;
    scheduledDateTo?: Date;
  } = {}): Promise<AppwriteMeeting[]> {
    const queries = [];

    if (filters.companyId) {
      queries.push(Query.equal('companyId', filters.companyId));
    }

    if (filters.createdBy) {
      queries.push(Query.equal('createdBy', filters.createdBy));
    }

    if (filters.scheduledDateFrom) {
      queries.push(Query.greaterThanEqual('scheduledDate', filters.scheduledDateFrom.toISOString()));
    }

    if (filters.scheduledDateTo) {
      queries.push(Query.lessThanEqual('scheduledDate', filters.scheduledDateTo.toISOString()));
    }

    queries.push(Query.orderDesc('scheduledDate'));

    const response = await databases.listDocuments(
      this.databaseId,
      this.collectionId,
      queries
    );

    return response.documents as unknown as AppwriteMeeting[];
  }

  /**
   * Find upcoming meetings
   */
  static async findUpcoming(days: number = 7): Promise<AppwriteMeeting[]> {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + days);

    const response = await databases.listDocuments(
      this.databaseId,
      this.collectionId,
      [
        Query.greaterThanEqual('scheduledDate', now.toISOString()),
        Query.lessThanEqual('scheduledDate', futureDate.toISOString()),
        Query.orderAsc('scheduledDate')
      ]
    );

    return response.documents as unknown as AppwriteMeeting[];
  }

  /**
   * Update meeting
   */
  static async update(id: string, data: UpdateMeetingData): Promise<AppwriteMeeting> {
    const updateData: any = {};

    if (data.scheduledDate) {
      updateData.scheduledDate = data.scheduledDate.toISOString();
    }

    if (data.duration !== undefined) {
      updateData.duration = data.duration;
    }

    if (data.attendees) {
      updateData.attendees = JSON.stringify(data.attendees);
    }

    if (data.notes !== undefined) {
      updateData.notes = data.notes;
    }

    return await databases.updateDocument(
      this.databaseId,
      this.collectionId,
      id,
      updateData
    ) as unknown as AppwriteMeeting;
  }

  /**
   * Delete meeting
   */
  static async delete(id: string): Promise<void> {
    await databases.deleteDocument(
      this.databaseId,
      this.collectionId,
      id
    );
  }

  /**
   * Update RSVP response for a user
   */
  static async updateRSVP(meetingId: string, userId: string, response: 'going' | 'not_going'): Promise<AppwriteMeeting> {
    const meeting = await this.findById(meetingId);
    if (!meeting) {
      throw new Error('Meeting not found');
    }

    // Parse existing RSVP responses
    const rsvpResponses = meeting.rsvpResponses ? JSON.parse(meeting.rsvpResponses) : {};
    rsvpResponses[userId] = response;

    // Update meeting status if someone is going
    const hasGoingResponse = Object.values(rsvpResponses).some(resp => resp === 'going');
    const status = hasGoingResponse ? 'confirmed' : 'scheduled';

    return await databases.updateDocument(
      this.databaseId,
      this.collectionId,
      meetingId,
      {
        rsvpResponses: JSON.stringify(rsvpResponses),
        status: status
      }
    ) as unknown as AppwriteMeeting;
  }

  /**
   * Add meeting notes after the meeting
   */
  static async addMeetingNotes(meetingId: string, notes: string): Promise<AppwriteMeeting> {
    return await databases.updateDocument(
      this.databaseId,
      this.collectionId,
      meetingId,
      {
        meetingNotes: notes,
        status: 'completed'
      }
    ) as unknown as AppwriteMeeting;
  }

  /**
   * Get meetings for meeting history (all meetings for a company)
   */
  static async findByCompanyForHistory(companyId: string): Promise<AppwriteMeeting[]> {
    const response = await databases.listDocuments(
      this.databaseId,
      this.collectionId,
      [
        Query.equal('companyId', companyId),
        Query.orderDesc('scheduledDate')
      ]
    );

    return response.documents as unknown as AppwriteMeeting[];
  }

  /**
   * Get meetings for meeting history (completed meetings only)
   */
  static async findCompletedByCompany(companyId: string): Promise<AppwriteMeeting[]> {
    const response = await databases.listDocuments(
      this.databaseId,
      this.collectionId,
      [
        Query.equal('companyId', companyId),
        Query.equal('status', 'completed'),
        Query.orderDesc('scheduledDate')
      ]
    );

    return response.documents as unknown as AppwriteMeeting[];
  }
}