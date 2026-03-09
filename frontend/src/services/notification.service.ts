import { apiClient } from '@/lib/api-client';
import type { Notification } from '@/types';

export const notificationApiService = {
  async getAll(): Promise<Notification[]> {
    return apiClient.get<Notification[]>('/api/notifications');
  },

  async create(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<Notification> {
    return apiClient.post<Notification>('/api/notifications', notification);
  },

  async markAsRead(id: string): Promise<Notification> {
    return apiClient.patch<Notification>(`/api/notifications/${id}`, { read: true });
  },

  async markAllAsRead(): Promise<void> {
    return apiClient.post('/api/notifications/mark-all-read');
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete(`/api/notifications/${id}`);
  },
};
