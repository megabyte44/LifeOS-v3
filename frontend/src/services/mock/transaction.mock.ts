import type { Transaction } from '@/types';
import { P_TRANSACTIONS } from '@/lib/placeholder-data';

let mockTransactions: Transaction[] = [...P_TRANSACTIONS];
let mockBudget = 5000000; // cents

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

export const transactionMockService = {
  async getAll(): Promise<Transaction[]> {
    await delay();
    return [...mockTransactions];
  },

  async create(tx: Omit<Transaction, 'id'>): Promise<Transaction> {
    await delay();
    const newTx: Transaction = { ...tx, id: `tx-${Date.now()}` };
    mockTransactions = [newTx, ...mockTransactions];
    return newTx;
  },

  async update(id: string, updates: Partial<Transaction>): Promise<Transaction> {
    await delay();
    const index = mockTransactions.findIndex((t) => t.id === id);
    if (index === -1) throw new Error(`Transaction ${id} not found`);
    mockTransactions[index] = { ...mockTransactions[index], ...updates };
    return mockTransactions[index];
  },

  async delete(id: string): Promise<void> {
    await delay();
    mockTransactions = mockTransactions.filter((t) => t.id !== id);
  },

  async getBudget(): Promise<{ budget: number }> {
    await delay();
    return { budget: mockBudget };
  },

  async updateBudget(budget: number): Promise<{ budget: number }> {
    await delay();
    mockBudget = budget;
    return { budget: mockBudget };
  },
};
