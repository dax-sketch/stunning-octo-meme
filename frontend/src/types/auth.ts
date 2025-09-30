export interface User {
  id: string;
  username: string;
  email: string;
  phoneNumber: string;
  role: 'CEO' | 'MANAGER' | 'TEAM_MEMBER';
  emailNotifications: boolean;
  smsNotifications: boolean;
  meetingReminders: boolean;
  auditReminders: boolean;
  notificationPreferences: {
    email: boolean;
    sms: boolean;
    meetingReminders: boolean;
    auditReminders: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    user: User;
    token: string;
    refreshToken?: string;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
}
