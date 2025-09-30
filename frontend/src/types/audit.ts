export interface Audit {
  id: string;
  companyId: string;
  companyName: string;
  scheduledDate: string;
  completedDate?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'overdue';
  assignedTo: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAuditData {
  companyId: string;
  scheduledDate: string;
  assignedTo: string;
  notes?: string;
}

export interface UpdateAuditData {
  scheduledDate?: string;
  completedDate?: string;
  assignedTo?: string;
  status?: 'scheduled' | 'in_progress' | 'completed' | 'overdue';
  notes?: string;
}

export interface AuditFilters {
  companyId?: string;
  assignedTo?: string;
  status?: 'scheduled' | 'in_progress' | 'completed' | 'overdue';
  scheduledDateFrom?: string;
  scheduledDateTo?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface AuditResponse {
  success: boolean;
  data?: Audit | Audit[];
  error?: {
    code: string;
    message: string;
  };
}

export interface AuditStatistics {
  total: number;
  scheduled: number;
  completed: number;
  overdue: number;
  upcomingWeek: number;
}

// Audit types removed for simplicity
