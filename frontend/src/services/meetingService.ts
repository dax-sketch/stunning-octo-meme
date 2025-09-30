import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const meetingAPI = axios.create({
  baseURL: `${API_BASE_URL}/api/meetings`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
meetingAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface CreateMeetingData {
  companyId: string;
  scheduledDate: Date;
  duration: number; // in minutes
  attendees: string[];
  notes?: string;
}

export interface Meeting {
  id: string;
  companyId: string;
  companyName: string;
  scheduledDate: string;
  duration: number;
  attendees: string[];
  notes?: string;
  createdBy: string;
  rsvpResponses?: { [userId: string]: 'going' | 'not_going' };
  rsvpDetails?: {
    [userId: string]: {
      response: 'going' | 'not_going';
      username: string;
      email: string;
    };
  };
  meetingNotes?: string;
  status?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MeetingResponse {
  success: boolean;
  data?: Meeting | Meeting[];
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export const meetingService = {
  async createMeeting(data: CreateMeetingData): Promise<MeetingResponse> {
    try {
      console.log('🔍 Creating meeting:', data);
      const response = await meetingAPI.post('/', {
        ...data,
        scheduledDate: data.scheduledDate.toISOString(),
      });
      console.log('✅ Meeting created:', response.data);
      return response.data;
    } catch (error: any) {
      console.error(
        '❌ Error creating meeting:',
        error.response?.data || error.message
      );
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Failed to create meeting. Please try again.',
        },
      };
    }
  },

  async getMeetings(): Promise<MeetingResponse> {
    try {
      const response = await meetingAPI.get('/');
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Failed to fetch meetings. Please try again.',
        },
      };
    }
  },

  async getUpcomingMeetings(days: number = 7): Promise<MeetingResponse> {
    try {
      const response = await meetingAPI.get(`/upcoming?days=${days}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Failed to fetch upcoming meetings. Please try again.',
        },
      };
    }
  },

  async getMeetingById(id: string): Promise<MeetingResponse> {
    try {
      const response = await meetingAPI.get(`/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Failed to fetch meeting. Please try again.',
        },
      };
    }
  },

  async updateMeeting(
    id: string,
    data: Partial<CreateMeetingData>
  ): Promise<MeetingResponse> {
    try {
      const updateData = { ...data };
      if (updateData.scheduledDate) {
        updateData.scheduledDate =
          updateData.scheduledDate.toISOString() as any;
      }

      const response = await meetingAPI.put(`/${id}`, updateData);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Failed to update meeting. Please try again.',
        },
      };
    }
  },

  async deleteMeeting(id: string): Promise<MeetingResponse> {
    try {
      const response = await meetingAPI.delete(`/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Failed to delete meeting. Please try again.',
        },
      };
    }
  },

  async updateRSVP(
    id: string,
    response: 'going' | 'not_going'
  ): Promise<MeetingResponse> {
    try {
      console.log('🔍 Sending RSVP request:', { id, response });
      const apiResponse = await meetingAPI.put(`/${id}/rsvp`, { response });
      console.log('✅ RSVP API response:', apiResponse.data);
      return apiResponse.data;
    } catch (error: any) {
      console.error(
        '❌ RSVP API error:',
        error.response?.data || error.message
      );
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Failed to update RSVP. Please try again.',
        },
      };
    }
  },

  async addMeetingNotes(id: string, notes: string): Promise<MeetingResponse> {
    try {
      const response = await meetingAPI.put(`/${id}/notes`, { notes });
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Failed to add meeting notes. Please try again.',
        },
      };
    }
  },

  async getCompletedMeetings(companyId: string): Promise<MeetingResponse> {
    try {
      const response = await meetingAPI.get(`/completed/${companyId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Failed to fetch completed meetings. Please try again.',
        },
      };
    }
  },

  async getMeetingHistory(companyId: string): Promise<MeetingResponse> {
    try {
      const response = await meetingAPI.get(`/completed/${companyId}`); // Using same endpoint since we updated the backend
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Failed to fetch meeting history. Please try again.',
        },
      };
    }
  },
};
