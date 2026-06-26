import type { TodoItem } from '@/types';
import { P_TODO_ITEMS } from '@/lib/placeholder-data';

// In-memory store for mock mode
let mockTodos: TodoItem[] = [...P_TODO_ITEMS];

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

export const todoMockService = {
  async getAll(): Promise<TodoItem[]> {
    await delay();
    return [...mockTodos];
  },

  async create(todo: Omit<TodoItem, 'id'>): Promise<TodoItem> {
    await delay();
    const newTodo: TodoItem = { ...todo, id: `todo-${Date.now()}` };
    mockTodos = [newTodo, ...mockTodos];
    return newTodo;
  },

  async update(id: string, updates: Partial<TodoItem>): Promise<TodoItem> {
    await delay();
    const index = mockTodos.findIndex((t) => t.id === id);
    if (index === -1) throw new Error(`Todo ${id} not found`);
    mockTodos[index] = { ...mockTodos[index], ...updates };
    return mockTodos[index];
  },

  async delete(id: string): Promise<void> {
    await delay();
    mockTodos = mockTodos.filter((t) => t.id !== id);
  },
};
