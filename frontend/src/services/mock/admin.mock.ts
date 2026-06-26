import type {
  AiConfiguration,
  SystemSettings,
  Announcement,
  AboutPageContent,
  UserStats,
  AdminDashboardStats,
  AdminAnalytics,
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
  insightsEnabled: false,
  insightsCron: '0 9 * * *',
  evaluationEnabled: false,
  evaluationSampleRate: 10,
  updatedAt: new Date().toISOString(),
  updatedBy: 'system',
};

const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  features: {
    aiChat: true,
    pushNotifications: true,
    waterTracker: true,
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

const MOCK_USERS: UserStats[] = [
  {
    uid: 'mock-1',
    email: 'alice@example.com',
    displayName: 'Alice',
    createdAt: '2025-01-10T00:00:00Z',
    lastLoginAt: '2025-03-01T00:00:00Z',
    notesCount: 12,
    todosCount: 5,
    habitsCount: 3,
    aiMessagesCount: 45,
    role: 'admin',
  },
  {
    uid: 'mock-2',
    email: 'bob@example.com',
    displayName: 'Bob',
    createdAt: '2025-02-15T00:00:00Z',
    lastLoginAt: '2025-02-20T00:00:00Z',
    notesCount: 8,
    todosCount: 2,
    habitsCount: 1,
    aiMessagesCount: 23,
    role: 'user',
  },
];

// ---------- In-memory stores ----------

let mockUsers = [...MOCK_USERS];
let mockAiConfig = { ...DEFAULT_AI_CONFIG };
let mockSystemSettings = { ...DEFAULT_SYSTEM_SETTINGS };
let mockAboutContent = { ...DEFAULT_ABOUT_CONTENT };
let mockAnnouncements: Announcement[] = [];

export const adminMockService = {
  // ----- Users -----
  async getUsers(): Promise<UserStats[]> {
    await delay();
    return [...mockUsers];
  },

  async updateUserRole(uid: string, role: string): Promise<void> {
    await delay();
    const idx = mockUsers.findIndex((u) => u.uid === uid);
    if (idx !== -1) mockUsers[idx] = { ...mockUsers[idx], role };
  },

  // ----- Dashboard -----
  async getDashboardStats(): Promise<AdminDashboardStats> {
    await delay();
    return {
      totalUsers: mockUsers.length,
      totalAiMessages: mockUsers.reduce((s, u) => s + u.aiMessagesCount, 0),
    };
  },

  // ----- Analytics -----
  async getAnalytics(days: number): Promise<AdminAnalytics> {
    await delay();
    const daily = Array.from({ length: days }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      return { date: d.toISOString().split('T')[0], count: Math.floor(Math.random() * 15 + 2) };
    });
    const total = daily.reduce((s, d) => s + d.count, 0);
    return {
      dailyMessages: daily,
      topUsers: mockUsers.map((u) => ({
        uid: u.uid,
        email: u.email,
        displayName: u.displayName,
        count: u.aiMessagesCount,
      })),
      totalMessages: total,
      avgPerDay: total / days,
    };
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
