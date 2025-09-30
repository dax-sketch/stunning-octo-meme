import { Client, Databases, Account, ID } from 'appwrite';
import * as dotenv from 'dotenv';

dotenv.config();

// Appwrite configuration
export const APPWRITE_CONFIG = {
  endpoint: process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1',
  projectId: process.env.APPWRITE_PROJECT_ID || '',
  apiKey: process.env.APPWRITE_API_KEY || '',
  databaseId: process.env.APPWRITE_DATABASE_ID || 'client-management',
};

// Collection IDs
export const COLLECTIONS = {
  USERS: 'users',
  COMPANIES: 'companies',
  NOTES: 'notes',
  AUDITS: 'audits',
  NOTIFICATIONS: 'notifications',
  MEETINGS: 'meetings',
  PAYMENTS: 'payments',
  TIER_CHANGE_LOGS: 'tier_change_logs',
  ROLE_CHANGE_REQUESTS: 'role_change_requests',
};

// Enums (since Appwrite doesn't have native enum support)
export const USER_ROLES = {
  CEO: 'CEO',
  MANAGER: 'MANAGER',
  TEAM_MEMBER: 'TEAM_MEMBER',
} as const;

export const COMPANY_TIERS = {
  TIER_1: 'TIER_1',
  TIER_2: 'TIER_2', 
  TIER_3: 'TIER_3',
} as const;

export const AUDIT_STATUS = {
  SCHEDULED: 'SCHEDULED',
  COMPLETED: 'COMPLETED',
  OVERDUE: 'OVERDUE',
} as const;

export const AUDIT_TYPES = {
  FINANCIAL: 'Financial',
  COMPLIANCE: 'Compliance',
  OPERATIONAL: 'Operational',
  SECURITY: 'Security',
  QUALITY: 'Quality',
  ENVIRONMENTAL: 'Environmental',
  SAFETY: 'Safety',
  IT: 'IT',
} as const;

export const NOTIFICATION_TYPES = {
  MEETING_REMINDER: 'MEETING_REMINDER',
  AUDIT_DUE: 'AUDIT_DUE',
  COMPANY_MILESTONE: 'COMPANY_MILESTONE',
} as const;

export const TIER_CHANGE_REASONS = {
  AUTOMATIC: 'AUTOMATIC',
  MANUAL_OVERRIDE: 'MANUAL_OVERRIDE',
} as const;

// Type definitions
export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];
export type CompanyTier = typeof COMPANY_TIERS[keyof typeof COMPANY_TIERS];
export type AuditStatus = typeof AUDIT_STATUS[keyof typeof AUDIT_STATUS];
export type AuditType = typeof AUDIT_TYPES[keyof typeof AUDIT_TYPES];
export type NotificationType = typeof NOTIFICATION_TYPES[keyof typeof NOTIFICATION_TYPES];
export type TierChangeReason = typeof TIER_CHANGE_REASONS[keyof typeof TIER_CHANGE_REASONS];

// Initialize Appwrite client
export const client = new Client()
  .setEndpoint(APPWRITE_CONFIG.endpoint)
  .setProject(APPWRITE_CONFIG.projectId);

// Set API key for server-side operations
if (APPWRITE_CONFIG.apiKey) {
  client.headers['X-Appwrite-Key'] = APPWRITE_CONFIG.apiKey;
}

// Initialize services
export const databases = new Databases(client);
export const account = new Account(client);

// Helper function to generate unique IDs
export const generateId = () => ID.unique();

// Validation helper
export function validateAppwriteConfig(): void {
  if (!APPWRITE_CONFIG.projectId) {
    throw new Error('APPWRITE_PROJECT_ID environment variable is required');
  }
  if (!APPWRITE_CONFIG.apiKey) {
    throw new Error('APPWRITE_API_KEY environment variable is required');
  }
}