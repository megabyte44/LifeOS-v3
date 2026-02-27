import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { credentialService } from '@/services';
import type { Credential } from '@/types';
import { useAuth } from '@/hooks/use-auth';

const QUERY_KEY = ['credentials'] as const;

export function useCredentials() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => credentialService.getAll(),
    enabled: !!user,
  });

  const addCredential = useMutation({
    mutationFn: (cred: Omit<Credential, 'id'>) => credentialService.create(cred),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  const updateCredential = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Credential> }) =>
      credentialService.update(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  const deleteCredential = useMutation({
    mutationFn: (id: string) => credentialService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  return {
    credentials: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    addCredential: addCredential.mutateAsync,
    updateCredential: updateCredential.mutateAsync,
    deleteCredential: deleteCredential.mutateAsync,
    isAdding: addCredential.isPending,
    isUpdating: updateCredential.isPending,
    isDeleting: deleteCredential.isPending,
  };
}
