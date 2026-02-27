import type { PlannerItem } from '@/types';

// Empty weekly schedule mock
let mockSchedule: Record<string, PlannerItem[]> = {};

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

export const plannerMockService = {
  async getWeeklySchedule(): Promise<Record<string, PlannerItem[]>> {
    await delay();
    return { ...mockSchedule };
  },

  async updateDaySchedule(
    day: string,
    items: PlannerItem[],
  ): Promise<Record<string, PlannerItem[]>> {
    await delay();
    mockSchedule = { ...mockSchedule, [day]: items };
    return { ...mockSchedule };
  },

  async addItem(day: string, item: Omit<PlannerItem, 'id'>): Promise<PlannerItem> {
    await delay();
    const newItem: PlannerItem = { ...item, id: `plan-${Date.now()}` };
    const dayItems = mockSchedule[day] ?? [];
    mockSchedule = { ...mockSchedule, [day]: [...dayItems, newItem] };
    return newItem;
  },

  async updateItem(day: string, id: string, updates: Partial<PlannerItem>): Promise<PlannerItem> {
    await delay();
    const dayItems = mockSchedule[day] ?? [];
    const index = dayItems.findIndex((i) => i.id === id);
    if (index === -1) throw new Error(`Planner item ${id} not found`);
    dayItems[index] = { ...dayItems[index], ...updates };
    mockSchedule = { ...mockSchedule, [day]: [...dayItems] };
    return dayItems[index];
  },

  async deleteItem(day: string, id: string): Promise<void> {
    await delay();
    const dayItems = mockSchedule[day] ?? [];
    mockSchedule = { ...mockSchedule, [day]: dayItems.filter((i) => i.id !== id) };
  },
};
