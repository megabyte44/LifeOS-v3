import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { noteService } from '@/services';
import type { Note } from '@/types';
import { useAuth } from '@/hooks/use-auth';

const QUERY_KEY = ['notes'] as const;

export function useNotes() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => noteService.getAll(),
    enabled: !!user,
  });

  const addNote = useMutation({
    mutationFn: (note: Omit<Note, 'id'>) => noteService.create(note),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  const updateNote = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Note> }) =>
      noteService.update(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  const deleteNote = useMutation({
    mutationFn: (id: string) => noteService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  return {
    notes: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    addNote: addNote.mutateAsync,
    updateNote: updateNote.mutateAsync,
    deleteNote: deleteNote.mutateAsync,
    isAdding: addNote.isPending,
    isUpdating: updateNote.isPending,
    isDeleting: deleteNote.isPending,
  };
}
