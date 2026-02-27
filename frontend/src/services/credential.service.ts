import { apiClient } from '@/lib/api-client';
import type { Credential } from '@/types';

export const credentialApiService = {
  async getAll(): Promise<Credential[]> {
    return apiClient.get<Credential[]>('/api/credentials');
  },

  async create(cred: Omit<Credential, 'id'>): Promise<Credential> {
    return apiClient.post<Credential>('/api/credentials', cred);
  },

  async update(id: string, updates: Partial<Credential>): Promise<Credential> {
    return apiClient.put<Credential>(`/api/credentials/${id}`, updates);
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete(`/api/credentials/${id}`);
  },
};
