import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { habitService } from '@/services';
import type { Habit } from '@/types';
import { useAuth } from '@/hooks/use-auth';

const QUERY_KEY = ['habits'] as const;
const EMPTY_HABITS: Habit[] = [];

export function useHabits() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => habitService.getAll(),
    enabled: !!user,
  });

  const addHabit = useMutation({
    mutationFn: (habit: Omit<Habit, 'id'>) => habitService.create(habit),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  const updateHabit = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Habit> }) =>
      habitService.update(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  const deleteHabit = useMutation({
    mutationFn: (id: string) => habitService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  return {
    habits: query.data ?? EMPTY_HABITS,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    addHabit: addHabit.mutateAsync,
    updateHabit: updateHabit.mutateAsync,
    deleteHabit: deleteHabit.mutateAsync,
    isAdding: addHabit.isPending,
    isUpdating: updateHabit.isPending,
    isDeleting: deleteHabit.isPending,
  };
}
