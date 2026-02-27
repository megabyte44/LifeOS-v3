import { apiClient } from '@/lib/api-client';
import type { UserProfile } from './mock/user.mock';

export const userApiService = {
  async getMe(): Promise<UserProfile> {
    return apiClient.get<UserProfile>('/api/users/me');
  },

  async updateMe(updates: Partial<UserProfile>): Promise<UserProfile> {
    return apiClient.patch<UserProfile>('/api/users/me', updates);
  },
};

export type { UserProfile };
