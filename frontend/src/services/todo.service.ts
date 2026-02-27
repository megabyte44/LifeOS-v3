import { apiClient } from '@/lib/api-client';
import type { TodoItem } from '@/types';

export const todoApiService = {
  async getAll(): Promise<TodoItem[]> {
    return apiClient.get<TodoItem[]>('/api/todos');
  },

  async create(todo: Omit<TodoItem, 'id'>): Promise<TodoItem> {
    return apiClient.post<TodoItem>('/api/todos', todo);
  },

  async update(id: string, updates: Partial<TodoItem>): Promise<TodoItem> {
    return apiClient.put<TodoItem>(`/api/todos/${id}`, updates);
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete(`/api/todos/${id}`);
  },
};
