import { apiClient } from '@/lib/api-client';
import type { UserProfile } from './mock/user.mock';
import type { AiProfileResponse } from '@/types';

export const userApiService = {
  async getMe(): Promise<UserProfile> {
    return apiClient.get<UserProfile>('/users/me');
  },

  async updateMe(updates: Partial<UserProfile>): Promise<UserProfile> {
    return apiClient.patch<UserProfile>('/users/me', updates);
  },

  async getAiProfile(): Promise<AiProfileResponse> {
    return apiClient.get<AiProfileResponse>('/profile');
  },

  async updateAiProfile(updates: Partial<AiProfileResponse>): Promise<AiProfileResponse> {
    return apiClient.put<AiProfileResponse>('/profile', updates);
  },
};

export type { UserProfile };
