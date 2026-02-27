import { apiClient } from '@/lib/api-client';
import type { Transaction } from '@/types';

export const transactionApiService = {
  async getAll(): Promise<Transaction[]> {
    return apiClient.get<Transaction[]>('/api/transactions');
  },

  async create(tx: Omit<Transaction, 'id'>): Promise<Transaction> {
    return apiClient.post<Transaction>('/api/transactions', tx);
  },

  async update(id: string, updates: Partial<Transaction>): Promise<Transaction> {
    return apiClient.put<Transaction>(`/api/transactions/${id}`, updates);
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete(`/api/transactions/${id}`);
  },

  async getBudget(): Promise<{ budget: number }> {
    return apiClient.get<{ budget: number }>('/api/transactions/budget');
  },

  async updateBudget(budget: number): Promise<{ budget: number }> {
    return apiClient.put<{ budget: number }>('/api/transactions/budget', { budget });
  },
};
