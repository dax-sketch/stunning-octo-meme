export interface DashboardMetrics {
  totalCompanies: number;
  companiesByTier: {
    TIER_1: number;
    TIER_2: number;
    TIER_3: number;
  };
  recentPayments: number;
  upcomingMeetings: number;
}

export interface AuditStatistics {
  total: number;
  scheduled: number;
  completed: number;
  overdue: number;
  upcomingThisMonth: number;
}

export interface UpcomingAudit {
  id: string;
  companyId: string;
  companyName: string;
  companyTier?: 'TIER_1' | 'TIER_2' | 'TIER_3';
  scheduledDate: string;
  assignedTo: string;
  assignedToUsername?: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'OVERDUE';
  notes?: string;
}

export interface RecentNotification {
  id: string;
  type: 'MEETING_REMINDER' | 'AUDIT_DUE' | 'COMPANY_MILESTONE';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  relatedCompanyId?: string;
}

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  path: string;
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
}
