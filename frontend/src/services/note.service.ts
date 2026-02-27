import { apiClient } from '@/lib/api-client';
import type { Note } from '@/types';

export const noteApiService = {
  async getAll(): Promise<Note[]> {
    return apiClient.get<Note[]>('/api/notes');
  },

  async create(note: Omit<Note, 'id'>): Promise<Note> {
    return apiClient.post<Note>('/api/notes', note);
  },

  async update(id: string, updates: Partial<Note>): Promise<Note> {
    return apiClient.put<Note>(`/api/notes/${id}`, updates);
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete(`/api/notes/${id}`);
  },
};
