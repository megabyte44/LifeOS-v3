const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  role: 'user' | 'admin';
  createdAt: string;
}

export const userMockService = {
  async getMe(): Promise<UserProfile> {
    await delay();
    return {
      uid: 'mock-uid-001',
      email: 'demo@smartlifeos.app',
      displayName: 'Demo User',
      photoURL: null,
      role: 'user',
      createdAt: new Date().toISOString(),
    };
  },

  async updateMe(updates: Partial<UserProfile>): Promise<UserProfile> {
    await delay();
    return {
      uid: 'mock-uid-001',
      email: 'demo@smartlifeos.app',
      displayName: 'Demo User',
      photoURL: null,
      role: 'user',
      createdAt: new Date().toISOString(),
      ...updates,
    };
  },
};
