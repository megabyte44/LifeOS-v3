import { apiClient } from '@/lib/api-client';
import type { UserProfile } from './mock/user.mock';
import type { AiProfileResponse } from '@/types';

export const userApiService = {
  async getMe(): Promise<UserProfile> {
    return apiClient.get<UserProfile>('/api/users/me');
  },

  async updateMe(updates: Partial<UserProfile>): Promise<UserProfile> {
    return apiClient.patch<UserProfile>('/api/users/me', updates);
  },

  async getAiProfile(): Promise<AiProfileResponse> {
    return apiClient.get<AiProfileResponse>('/api/profile');
  },

  async updateAiProfile(updates: Partial<AiProfileResponse>): Promise<AiProfileResponse> {
    return apiClient.put<AiProfileResponse>('/api/profile', updates);
  },
};

export type { UserProfile };
