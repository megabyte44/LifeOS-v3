import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionService } from '@/services';
import type { Transaction } from '@/types';
import { useAuth } from '@/hooks/use-auth';

const TX_KEY = ['transactions'] as const;
const BUDGET_KEY = ['transactions', 'budget'] as const;
// Stable empty fallback — avoids creating a new [] on every render
// which would cause useEffect(dep=[transactions]) to fire in an infinite loop.
const EMPTY_TRANSACTIONS: Transaction[] = [];

export function useTransactions() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: TX_KEY,
    queryFn: () => transactionService.getAll(),
    enabled: !!user,
  });

  const budgetQuery = useQuery({
    queryKey: BUDGET_KEY,
    queryFn: () => transactionService.getBudget(),
    enabled: !!user,
  });

  const addTransaction = useMutation({
    mutationFn: (tx: Omit<Transaction, 'id'>) => transactionService.create(tx),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TX_KEY }),
  });

  const updateTransaction = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Transaction> }) =>
      transactionService.update(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TX_KEY }),
  });

  const deleteTransaction = useMutation({
    mutationFn: (id: string) => transactionService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TX_KEY }),
  });

  const updateBudget = useMutation({
    mutationFn: (budget: number) => transactionService.updateBudget(budget),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: BUDGET_KEY }),
  });

  return {
    transactions: query.data ?? EMPTY_TRANSACTIONS,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    monthlyBudget: budgetQuery.data?.budget ?? 0,
    isBudgetLoading: budgetQuery.isLoading,
    addTransaction: addTransaction.mutateAsync,
    updateTransaction: updateTransaction.mutateAsync,
    deleteTransaction: deleteTransaction.mutateAsync,
    updateBudget: updateBudget.mutateAsync,
    isAdding: addTransaction.isPending,
    isUpdating: updateTransaction.isPending,
    isDeleting: deleteTransaction.isPending,
  };
}
