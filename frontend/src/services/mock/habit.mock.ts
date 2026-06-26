import type { Habit } from '@/types';
import { P_HABITS } from '@/lib/placeholder-data';

let mockHabits: Habit[] = [...P_HABITS];

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

export const habitMockService = {
  async getAll(): Promise<Habit[]> {
    await delay();
    return [...mockHabits];
  },

  async create(habit: Omit<Habit, 'id'>): Promise<Habit> {
    await delay();
    const newHabit: Habit = { ...habit, id: `habit-${Date.now()}` };
    mockHabits = [...mockHabits, newHabit];
    return newHabit;
  },

  async update(id: string, updates: Partial<Habit>): Promise<Habit> {
    await delay();
    const index = mockHabits.findIndex((h) => h.id === id);
    if (index === -1) throw new Error(`Habit ${id} not found`);
    mockHabits[index] = { ...mockHabits[index], ...updates };
    return mockHabits[index];
  },

  async delete(id: string): Promise<void> {
    await delay();
    mockHabits = mockHabits.filter((h) => h.id !== id);
  },
};
