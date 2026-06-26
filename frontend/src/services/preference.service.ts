import { apiClient } from '@/lib/api-client';
import type { UserPreferences } from '@/types';

export const preferenceApiService = {
  async get(): Promise<UserPreferences> {
    return apiClient.get<UserPreferences>('/preferences');
  },

  async update(updates: Partial<UserPreferences>): Promise<UserPreferences> {
    return apiClient.put<UserPreferences>('/preferences', updates);
  },
};
