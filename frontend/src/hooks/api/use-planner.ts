import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { plannerService } from '@/services';
import type { PlannerItem } from '@/types';
import { useAuth } from '@/hooks/use-auth';

const QUERY_KEY = ['planner'] as const;
const EMPTY_SCHEDULE: Record<string, PlannerItem[]> = {};

export function usePlanner() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => plannerService.getWeeklySchedule(),
    enabled: !!user,
  });

  const updateDaySchedule = useMutation({
    mutationFn: ({ day, items }: { day: string; items: PlannerItem[] }) =>
      plannerService.updateDaySchedule(day, items),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  const addItem = useMutation({
    mutationFn: ({ day, item }: { day: string; item: Omit<PlannerItem, 'id'> }) =>
      plannerService.addItem(day, item),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  const updateItem = useMutation({
    mutationFn: ({ day, id, updates }: { day: string; id: string; updates: Partial<PlannerItem> }) =>
      plannerService.updateItem(day, id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  const deleteItem = useMutation({
    mutationFn: ({ day, id }: { day: string; id: string }) =>
      plannerService.deleteItem(day, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  return {
    weeklySchedule: query.data ?? EMPTY_SCHEDULE,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    updateDaySchedule: updateDaySchedule.mutateAsync,
    addItem: addItem.mutateAsync,
    updateItem: updateItem.mutateAsync,
    deleteItem: deleteItem.mutateAsync,
  };
}
