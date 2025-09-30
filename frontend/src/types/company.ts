export interface Company {
  id: string;
  name: string;
  startDate: string;
  phoneNumber: string;
  email: string;
  website: string;
  tier: 'TIER_1' | 'TIER_2' | 'TIER_3';
  adSpend: number;
  lastPaymentDate?: string;
  lastPaymentAmount?: number;
  lastMeetingDate?: string;
  lastMeetingAttendees?: string[];
  lastMeetingDuration?: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCompanyData {
  name: string;
  startDate: string;
  phoneNumber: string;
  email: string;
  website: string;
  adSpend: number;
}

export interface UpdateCompanyData extends Partial<CreateCompanyData> {
  lastPaymentDate?: string;
  lastPaymentAmount?: number;
  lastMeetingDate?: string;
  lastMeetingAttendees?: string[];
  lastMeetingDuration?: number;
}

export interface CompanyFilters {
  tier?: 'TIER_1' | 'TIER_2' | 'TIER_3';
  search?: string;
  limit?: number;
  offset?: number;
}

export interface CompanyResponse {
  success: boolean;
  data?: Company | Company[];
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export const TIER_LABELS = {
  TIER_1: 'Tier 1 - High Weekly Ad Spend',
  TIER_2: 'Tier 2 - New Companies',
  TIER_3: 'Tier 3 - Low Weekly Ad Spend',
} as const;

export const TIER_COLORS = {
  TIER_1: '#4caf50', // Green
  TIER_2: '#ff9800', // Orange
  TIER_3: '#f44336', // Red
} as const;
