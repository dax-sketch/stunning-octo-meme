import { QueryClient } from '@tanstack/react-query';

// Create a client with optimized defaults
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes by default
      staleTime: 5 * 60 * 1000,
      // Keep data in cache for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry failed requests 3 times
      retry: 3,
      // Retry with exponential backoff
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus for critical data
      refetchOnWindowFocus: false,
      // Don't refetch on reconnect by default
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry mutations once
      retry: 1,
    },
  },
});

// Query keys factory for consistent cache management
export const queryKeys = {
  // Company queries
  companies: {
    all: ['companies'] as const,
    lists: () => [...queryKeys.companies.all, 'list'] as const,
    list: (filters?: any) => [...queryKeys.companies.lists(), filters] as const,
    details: () => [...queryKeys.companies.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.companies.details(), id] as const,
  },

  // User queries
  users: {
    all: ['users'] as const,
    profile: () => [...queryKeys.users.all, 'profile'] as const,
    notifications: () => [...queryKeys.users.all, 'notifications'] as const,
  },

  // Dashboard queries
  dashboard: {
    all: ['dashboard'] as const,
    overview: () => [...queryKeys.dashboard.all, 'overview'] as const,
    stats: () => [...queryKeys.dashboard.all, 'stats'] as const,
  },

  // Notes queries
  notes: {
    all: ['notes'] as const,
    byCompany: (companyId: string) =>
      [...queryKeys.notes.all, 'company', companyId] as const,
  },

  // Audit queries
  audits: {
    all: ['audits'] as const,
    scheduled: () => [...queryKeys.audits.all, 'scheduled'] as const,
    byCompany: (companyId: string) =>
      [...queryKeys.audits.all, 'company', companyId] as const,
  },

  // Tier queries
  tiers: {
    all: ['tiers'] as const,
    history: (companyId: string) =>
      [...queryKeys.tiers.all, 'history', companyId] as const,
  },
} as const;
