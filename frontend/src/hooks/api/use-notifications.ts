import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '@/services';
import type { Notification } from '@/types';
import { useAuth } from '@/hooks/use-auth';

const QUERY_KEY = ['notifications'] as const;

export function useNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => notificationService.getAll(),
    enabled: !!user,
  });

  const markAsRead = useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  const markAllAsRead = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  const deleteNotification = useMutation({
    mutationFn: (id: string) => notificationService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  const unreadCount = (query.data ?? []).filter((n: Notification) => !n.read).length;

  return {
    notifications: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    unreadCount,
    markAsRead: markAsRead.mutateAsync,
    markAllAsRead: markAllAsRead.mutateAsync,
    deleteNotification: deleteNotification.mutateAsync,
  };
}
