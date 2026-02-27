import type { Goal } from '@/types';
import { P_GOALS } from '@/lib/placeholder-data';

let mockGoals: Goal[] = [...P_GOALS];

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

export const goalMockService = {
  async getAll(): Promise<Goal[]> {
    await delay();
    return [...mockGoals];
  },

  async getById(id: string): Promise<Goal> {
    await delay();
    const goal = mockGoals.find((g) => g.id === id);
    if (!goal) throw new Error(`Goal ${id} not found`);
    return { ...goal };
  },

  async create(goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>): Promise<Goal> {
    await delay();
    const now = new Date().toISOString();
    const newGoal: Goal = {
      ...goal,
      id: `goal-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    mockGoals = [...mockGoals, newGoal];
    return newGoal;
  },

  async update(id: string, updates: Partial<Goal>): Promise<Goal> {
    await delay();
    const index = mockGoals.findIndex((g) => g.id === id);
    if (index === -1) throw new Error(`Goal ${id} not found`);
    mockGoals[index] = {
      ...mockGoals[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return mockGoals[index];
  },

  async delete(id: string): Promise<void> {
    await delay();
    mockGoals = mockGoals.filter((g) => g.id !== id);
  },
};
