import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { todoService } from '@/services';
import type { TodoItem } from '@/types';
import { useAuth } from '@/hooks/use-auth';

const QUERY_KEY = ['todos'] as const;
const EMPTY_TODOS: TodoItem[] = [];

export function useTodos() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => todoService.getAll(),
    enabled: !!user,
  });

  const addTodo = useMutation({
    mutationFn: (todo: Omit<TodoItem, 'id'>) => todoService.create(todo),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  const updateTodo = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<TodoItem> }) =>
      todoService.update(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  const deleteTodo = useMutation({
    mutationFn: (id: string) => todoService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  return {
    todos: query.data ?? EMPTY_TODOS,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    addTodo: addTodo.mutateAsync,
    updateTodo: updateTodo.mutateAsync,
    deleteTodo: deleteTodo.mutateAsync,
    isAdding: addTodo.isPending,
    isUpdating: updateTodo.isPending,
    isDeleting: deleteTodo.isPending,
  };
}
