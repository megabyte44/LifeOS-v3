import type {
  AiConfiguration,
  SystemSettings,
  Announcement,
  AboutPageContent,
  UserStats,
} from '@/types';

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

// ---------- Default data ----------

const DEFAULT_AI_CONFIG: AiConfiguration = {
  systemInstructions: {
    casualBuddy: 'You are a friendly AI assistant. Be casual, helpful, and concise.',
    professionalAssistant: 'You are a professional AI assistant. Be formal, precise, and thorough.',
  },
  defaultPersonality: 'casual',
  modelConfig: {
    provider: 'openrouter',
    model: 'meta-llama/llama-3.1-8b-instruct:free',
    temperature: 0.7,
    maxTokens: 2048,
    topP: 0.9,
  },
  ragEnabled: false,
  updatedAt: new Date().toISOString(),
  updatedBy: 'system',
};

const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  features: {
    aiChat: true,
    pushNotifications: true,
    waterTracker: true,
    gymTracker: true,
    passwordManager: true,
    budgetTracker: true,
    habitTracker: true,
    planner: true,
  },
  maintenance: {
    enabled: false,
    message: '',
  },
  limits: {
    maxNotesPerUser: 100,
    maxTodosPerUser: 50,
    maxAiMessagesPerDay: 50,
  },
  updatedAt: new Date().toISOString(),
  updatedBy: 'system',
};

const DEFAULT_ABOUT_CONTENT: AboutPageContent = {
  title: 'SmartLifeOS',
  description: 'Your all-in-one personal life management system.',
  version: '1.0.0',
  markdownContent: '# About SmartLifeOS\n\nManage your life efficiently.',
  features: [
    { icon: 'Zap', title: 'Fast', description: 'Lightning-fast performance' },
    { icon: 'Shield', title: 'Secure', description: 'Your data is encrypted and safe' },
    { icon: 'Smartphone', title: 'Mobile-first', description: 'Works anywhere, anytime' },
  ],
  contact: {
    email: 'support@smartlifeos.app',
    github: 'https://github.com/smartlifeos',
  },
  updatedAt: new Date().toISOString(),
  updatedBy: 'system',
};

// ---------- In-memory stores ----------

let mockAiConfig = { ...DEFAULT_AI_CONFIG };
let mockSystemSettings = { ...DEFAULT_SYSTEM_SETTINGS };
let mockAboutContent = { ...DEFAULT_ABOUT_CONTENT };
let mockAnnouncements: Announcement[] = [];

export const adminMockService = {
  // ----- Users -----
  async getUsers(): Promise<UserStats[]> {
    await delay();
    return [];
  },

  // ----- AI Config -----
  async getAiConfig(): Promise<AiConfiguration> {
    await delay();
    return { ...mockAiConfig };
  },

  async updateAiConfig(config: Partial<AiConfiguration>): Promise<AiConfiguration> {
    await delay();
    mockAiConfig = { ...mockAiConfig, ...config, updatedAt: new Date().toISOString() };
    return { ...mockAiConfig };
  },

  // ----- System Settings -----
  async getSystemSettings(): Promise<SystemSettings> {
    await delay();
    return { ...mockSystemSettings };
  },

  async updateSystemSettings(settings: Partial<SystemSettings>): Promise<SystemSettings> {
    await delay();
    mockSystemSettings = { ...mockSystemSettings, ...settings, updatedAt: new Date().toISOString() };
    return { ...mockSystemSettings };
  },

  // ----- Announcements -----
  async getAnnouncements(): Promise<Announcement[]> {
    await delay();
    return [...mockAnnouncements];
  },

  async createAnnouncement(
    announcement: Omit<Announcement, 'id' | 'createdAt'>,
  ): Promise<Announcement> {
    await delay();
    const newItem: Announcement = {
      ...announcement,
      id: `ann-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    mockAnnouncements = [newItem, ...mockAnnouncements];
    return newItem;
  },

  async updateAnnouncement(id: string, updates: Partial<Announcement>): Promise<Announcement> {
    await delay();
    const index = mockAnnouncements.findIndex((a) => a.id === id);
    if (index === -1) throw new Error(`Announcement ${id} not found`);
    mockAnnouncements[index] = { ...mockAnnouncements[index], ...updates };
    return mockAnnouncements[index];
  },

  async deleteAnnouncement(id: string): Promise<void> {
    await delay();
    mockAnnouncements = mockAnnouncements.filter((a) => a.id !== id);
  },

  // ----- About -----
  async getAboutContent(): Promise<AboutPageContent> {
    await delay();
    return { ...mockAboutContent };
  },

  async updateAboutContent(content: Partial<AboutPageContent>): Promise<AboutPageContent> {
    await delay();
    mockAboutContent = { ...mockAboutContent, ...content, updatedAt: new Date().toISOString() };
    return { ...mockAboutContent };
  },

  // ----- Admin check -----
  async checkAdmin(): Promise<{ isAdmin: boolean }> {
    await delay(100);
    return { isAdmin: true };
  },
};
