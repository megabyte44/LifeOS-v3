import { apiClient } from '@/lib/api-client';
import type { Notification } from '@/types';

export const notificationApiService = {
  async getAll(): Promise<Notification[]> {
    return apiClient.get<Notification[]>('/notifications');
  },

  async create(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<Notification> {
    return apiClient.post<Notification>('/notifications', notification);
  },

  async markAsRead(id: string): Promise<Notification> {
    return apiClient.patch<Notification>(`/notifications/${id}`, { read: true });
  },

  async markAllAsRead(): Promise<void> {
    return apiClient.post('/notifications/mark-all-read');
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete(`/notifications/${id}`);
  },
};
