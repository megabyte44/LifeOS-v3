import { apiClient } from '@/lib/api-client';
import type {
  AiConfiguration,
  SystemSettings,
  Announcement,
  AboutPageContent,
  UserStats,
} from '@/types';

export const adminApiService = {
  // ----- Users -----
  async getUsers(): Promise<UserStats[]> {
    return apiClient.get<UserStats[]>('/api/admin/users');
  },

  // ----- AI Config -----
  async getAiConfig(): Promise<AiConfiguration> {
    return apiClient.get<AiConfiguration>('/api/admin/ai-config');
  },

  async updateAiConfig(config: Partial<AiConfiguration>): Promise<AiConfiguration> {
    return apiClient.put<AiConfiguration>('/api/admin/ai-config', config);
  },

  // ----- System Settings -----
  async getSystemSettings(): Promise<SystemSettings> {
    return apiClient.get<SystemSettings>('/api/admin/settings');
  },

  async updateSystemSettings(settings: Partial<SystemSettings>): Promise<SystemSettings> {
    return apiClient.put<SystemSettings>('/api/admin/settings', settings);
  },

  // ----- Announcements -----
  async getAnnouncements(): Promise<Announcement[]> {
    return apiClient.get<Announcement[]>('/api/admin/announcements');
  },

  async createAnnouncement(
    announcement: Omit<Announcement, 'id' | 'createdAt'>,
  ): Promise<Announcement> {
    return apiClient.post<Announcement>('/api/admin/announcements', announcement);
  },

  async updateAnnouncement(id: string, updates: Partial<Announcement>): Promise<Announcement> {
    return apiClient.put<Announcement>(`/api/admin/announcements/${id}`, updates);
  },

  async deleteAnnouncement(id: string): Promise<void> {
    return apiClient.delete(`/api/admin/announcements/${id}`);
  },

  // ----- About -----
  async getAboutContent(): Promise<AboutPageContent> {
    return apiClient.get<AboutPageContent>('/api/admin/about');
  },

  async updateAboutContent(content: Partial<AboutPageContent>): Promise<AboutPageContent> {
    return apiClient.put<AboutPageContent>('/api/admin/about', content);
  },

  // ----- Admin check -----
  async checkAdmin(): Promise<{ isAdmin: boolean }> {
    return apiClient.get<{ isAdmin: boolean }>('/api/admin/check');
  },
};
