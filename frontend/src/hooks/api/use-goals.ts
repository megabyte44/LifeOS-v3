import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { goalService } from '@/services';
import type { Goal } from '@/types';
import { useAuth } from '@/hooks/use-auth';

const QUERY_KEY = ['goals'] as const;

export function useGoals() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => goalService.getAll(),
    enabled: !!user,
  });

  const addGoal = useMutation({
    mutationFn: (goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) =>
      goalService.create(goal),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  const updateGoal = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Goal> }) =>
      goalService.update(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  const deleteGoal = useMutation({
    mutationFn: (id: string) => goalService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  return {
    goals: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    addGoal: addGoal.mutateAsync,
    updateGoal: updateGoal.mutateAsync,
    deleteGoal: deleteGoal.mutateAsync,
    isAdding: addGoal.isPending,
    isUpdating: updateGoal.isPending,
    isDeleting: deleteGoal.isPending,
  };
}
