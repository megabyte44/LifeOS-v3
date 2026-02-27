import type { Credential } from '@/types';
import { P_PASSWORDS } from '@/lib/placeholder-data';

let mockCredentials: Credential[] = [...P_PASSWORDS] as Credential[];

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

export const credentialMockService = {
  async getAll(): Promise<Credential[]> {
    await delay();
    return [...mockCredentials];
  },

  async create(cred: Omit<Credential, 'id'>): Promise<Credential> {
    await delay();
    const newCred: Credential = {
      ...cred,
      id: `pwd-${Date.now()}`,
      lastUpdated: new Date().toISOString(),
    };
    mockCredentials = [newCred, ...mockCredentials];
    return newCred;
  },

  async update(id: string, updates: Partial<Credential>): Promise<Credential> {
    await delay();
    const index = mockCredentials.findIndex((c) => c.id === id);
    if (index === -1) throw new Error(`Credential ${id} not found`);
    mockCredentials[index] = {
      ...mockCredentials[index],
      ...updates,
      lastUpdated: new Date().toISOString(),
    };
    return mockCredentials[index];
  },

  async delete(id: string): Promise<void> {
    await delay();
    mockCredentials = mockCredentials.filter((c) => c.id !== id);
  },
};
