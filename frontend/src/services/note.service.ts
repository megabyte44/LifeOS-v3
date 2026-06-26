import { apiClient } from '@/lib/api-client';
import type { Note } from '@/types';

export const noteApiService = {
  async getAll(): Promise<Note[]> {
    return apiClient.get<Note[]>('/notes');
  },

  async create(note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note> {
    return apiClient.post<Note>('/notes', note);
  },

  async update(id: string, updates: Partial<Note>): Promise<Note> {
    return apiClient.put<Note>(`/notes/${id}`, updates);
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete(`/notes/${id}`);
  },
};
