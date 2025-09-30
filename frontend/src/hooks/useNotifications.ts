import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '../services/notificationService';
import { queryKeys } from '../lib/queryClient';

// Hook for fetching user notifications
export const useNotifications = () => {
  return useQuery({
    queryKey: queryKeys.users.notifications(),
    queryFn: () => notificationService.getNotifications(),
    staleTime: 1 * 60 * 1000, // 1 minute for notifications (more frequent updates)
    gcTime: 5 * 60 * 1000, // 5 minutes cache time
    refetchInterval: 2 * 60 * 1000, // Auto-refetch every 2 minutes
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  });
};

// Hook for marking notification as read
export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) =>
      notificationService.markAsRead(notificationId),
    onSuccess: () => {
      // Invalidate notifications to update read status
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.notifications(),
      });
    },
  });
};
