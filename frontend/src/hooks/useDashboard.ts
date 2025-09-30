import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboardService';
import { queryKeys } from '../lib/queryClient';

// Hook for fetching dashboard overview data
export const useDashboardOverview = () => {
  return useQuery({
    queryKey: queryKeys.dashboard.overview(),
    queryFn: dashboardService.getDashboardData,
    staleTime: 3 * 60 * 1000, // 3 minutes for dashboard data
    gcTime: 10 * 60 * 1000, // 10 minutes cache time
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  });
};

// Hook for fetching dashboard statistics
export const useDashboardStats = () => {
  return useQuery({
    queryKey: queryKeys.dashboard.stats(),
    queryFn: dashboardService.getStats,
    staleTime: 5 * 60 * 1000, // 5 minutes for stats
    gcTime: 15 * 60 * 1000, // 15 minutes cache time
  });
};
