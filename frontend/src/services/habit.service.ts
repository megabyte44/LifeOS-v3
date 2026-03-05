import { apiClient } from '@/lib/api-client';
import type { Habit } from '@/types';

export const habitApiService = {
  async getAll(): Promise<Habit[]> {
    // Exclude gym-context habits — those are managed by the gym page / gym service
    const habits = await apiClient.get<Habit[]>('/api/habits');
    return habits.filter(h => h.context !== 'gym');
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
