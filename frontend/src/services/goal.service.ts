import { apiClient } from '@/lib/api-client';
import type { Goal } from '@/types';

export const goalApiService = {
  async getAll(): Promise<Goal[]> {
    return apiClient.get<Goal[]>('/api/goals');
  },

  async getById(id: string): Promise<Goal> {
    return apiClient.get<Goal>(`/api/goals/${id}`);
  },

  async create(goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>): Promise<Goal> {
    return apiClient.post<Goal>('/api/goals', goal);
  },

  async update(id: string, updates: Partial<Goal>): Promise<Goal> {
    return apiClient.put<Goal>(`/api/goals/${id}`, updates);
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete(`/api/goals/${id}`);
  },
};
