import { apiClient } from '@/lib/api-client';
import type { Habit } from '@/types';

export const habitApiService = {
  async getAll(): Promise<Habit[]> {
    return apiClient.get<Habit[]>('/api/habits');
  },

  async create(habit: Omit<Habit, 'id'>): Promise<Habit> {
    return apiClient.post<Habit>('/api/habits', habit);
  },

  async update(id: string, updates: Partial<Habit>): Promise<Habit> {
    return apiClient.put<Habit>(`/api/habits/${id}`, updates);
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete(`/api/habits/${id}`);
  },
};
