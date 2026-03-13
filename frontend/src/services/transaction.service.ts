import { apiClient } from '@/lib/api-client';
import type { Transaction } from '@/types';

export const transactionApiService = {
  async getAll(): Promise<Transaction[]> {
    return apiClient.get<Transaction[]>('/transactions');
  },

  async create(tx: Omit<Transaction, 'id'>): Promise<Transaction> {
    return apiClient.post<Transaction>('/transactions', tx);
  },

  async update(id: string, updates: Partial<Transaction>): Promise<Transaction> {
    return apiClient.put<Transaction>(`/transactions/${id}`, updates);
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete(`/transactions/${id}`);
  },

  async getBudget(): Promise<{ budget: number }> {
    return apiClient.get<{ budget: number }>('/transactions/budget');
  },

  async updateBudget(budget: number): Promise<{ budget: number }> {
    return apiClient.put<{ budget: number }>('/transactions/budget', { budget });
  },
};
