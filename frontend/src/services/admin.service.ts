import { apiClient } from '@/lib/api-client';
import type {
  AiConfiguration,
  SystemSettings,
  Announcement,
  AboutPageContent,
  UserStats,
  AdminDashboardStats,
  AdminAnalytics,
} from '@/types';

export const adminApiService = {
  // ----- Users -----
  async getUsers(): Promise<UserStats[]> {
    return apiClient.get<UserStats[]>('/admin/users');
  },

  async updateUserRole(uid: string, role: string): Promise<void> {
    return apiClient.put<void>(`/admin/users/${uid}/role`, { role });
  },

  // ----- Dashboard -----
  async getDashboardStats(): Promise<AdminDashboardStats> {
    return apiClient.get<AdminDashboardStats>('/admin/dashboard');
  },

  // ----- Analytics -----
  async getAnalytics(days: number): Promise<AdminAnalytics> {
    return apiClient.get<AdminAnalytics>(`/admin/analytics?days=${days}`);
  },

  // ----- AI Config -----
  async getAiConfig(): Promise<AiConfiguration> {
    return apiClient.get<AiConfiguration>('/admin/ai-config');
  },

  async updateAiConfig(config: Partial<AiConfiguration>): Promise<AiConfiguration> {
    return apiClient.put<AiConfiguration>('/admin/ai-config', config);
  },

  // ----- System Settings -----
  async getSystemSettings(): Promise<SystemSettings> {
    return apiClient.get<SystemSettings>('/admin/settings');
  },

  async updateSystemSettings(settings: Partial<SystemSettings>): Promise<SystemSettings> {
    return apiClient.put<SystemSettings>('/admin/settings', settings);
  },

  // ----- Announcements -----
  async getAnnouncements(): Promise<Announcement[]> {
    return apiClient.get<Announcement[]>('/admin/announcements');
  },

  async createAnnouncement(
    announcement: Omit<Announcement, 'id' | 'createdAt'>,
  ): Promise<Announcement> {
    return apiClient.post<Announcement>('/admin/announcements', announcement);
  },

  async updateAnnouncement(id: string, updates: Partial<Announcement>): Promise<Announcement> {
    return apiClient.put<Announcement>(`/admin/announcements/${id}`, updates);
  },

  async deleteAnnouncement(id: string): Promise<void> {
    return apiClient.delete(`/admin/announcements/${id}`);
  },

  // ----- About -----
  async getAboutContent(): Promise<AboutPageContent> {
    return apiClient.get<AboutPageContent>('/admin/about');
  },

  async updateAboutContent(content: Partial<AboutPageContent>): Promise<AboutPageContent> {
    return apiClient.put<AboutPageContent>('/admin/about', content);
  },

  // ----- Admin check -----
  async checkAdmin(): Promise<{ isAdmin: boolean }> {
    return apiClient.get<{ isAdmin: boolean }>('/admin/check');
  },
};
