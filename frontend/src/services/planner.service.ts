import { apiClient } from '@/lib/api-client';
import type { PlannerItem } from '@/types';

export const plannerApiService = {
  async getWeeklySchedule(): Promise<Record<string, PlannerItem[]>> {
    return apiClient.get<Record<string, PlannerItem[]>>('/planner');
  },

  async updateDaySchedule(
    day: string,
    items: PlannerItem[],
  ): Promise<Record<string, PlannerItem[]>> {
    return apiClient.put<Record<string, PlannerItem[]>>(`/planner/${encodeURIComponent(day)}`, { items });
  },

  async addItem(day: string, item: Omit<PlannerItem, 'id'>): Promise<PlannerItem> {
    return apiClient.post<PlannerItem>(`/planner/${encodeURIComponent(day)}/items`, item);
  },

  async updateItem(day: string, id: string, updates: Partial<PlannerItem>): Promise<PlannerItem> {
    return apiClient.put<PlannerItem>(`/planner/${encodeURIComponent(day)}/items/${id}`, updates);
  },

  async deleteItem(day: string, id: string): Promise<void> {
    return apiClient.delete(`/planner/${encodeURIComponent(day)}/items/${id}`);
  },
};
