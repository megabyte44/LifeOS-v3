import { apiClient } from '@/lib/api-client';
import type { Credential } from '@/types';

export const credentialApiService = {
  async getAll(): Promise<Credential[]> {
    return apiClient.get<Credential[]>('/credentials');
  },

  async create(cred: Omit<Credential, 'id'>): Promise<Credential> {
    return apiClient.post<Credential>('/credentials', cred);
  },

  async update(id: string, updates: Partial<Credential>): Promise<Credential> {
    return apiClient.put<Credential>(`/credentials/${id}`, updates);
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete(`/credentials/${id}`);
  },
};
