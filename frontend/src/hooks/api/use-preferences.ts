import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { preferenceService } from '@/services';
import type { UserPreferences } from '@/types';
import { useAuth } from '@/hooks/use-auth';

const QUERY_KEY = ['preferences'] as const;

export function usePreferences() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => preferenceService.get(),
    enabled: !!user,
  });

  const updatePreferences = useMutation({
    mutationFn: (updates: Partial<UserPreferences>) => preferenceService.update(updates),
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEY, data);
    },
  });

  return {
    preferences: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    updatePreferences: updatePreferences.mutateAsync,
    isUpdating: updatePreferences.isPending,
  };
}
