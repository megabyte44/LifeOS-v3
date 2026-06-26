import type { Notification } from '@/types';
import { P_NOTIFICATIONS } from '@/lib/placeholder-data';

let mockNotifications: Notification[] = [...P_NOTIFICATIONS];

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

export const notificationMockService = {
  async getAll(): Promise<Notification[]> {
    await delay();
    return [...mockNotifications];
  },

  async create(notification: Omit<Notification, 'id'>): Promise<Notification> {
    await delay();
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}`,
    };
    mockNotifications = [newNotification, ...mockNotifications];
    return newNotification;
  },

  async markAsRead(id: string): Promise<Notification> {
    await delay();
    const index = mockNotifications.findIndex((n) => n.id === id);
    if (index === -1) throw new Error(`Notification ${id} not found`);
    mockNotifications[index] = { ...mockNotifications[index], read: true };
    return mockNotifications[index];
  },

  async markAllAsRead(): Promise<void> {
    await delay();
    mockNotifications = mockNotifications.map((n) => ({ ...n, read: true }));
  },

  async delete(id: string): Promise<void> {
    await delay();
    mockNotifications = mockNotifications.filter((n) => n.id !== id);
  },
};
