import type { Note } from '@/types';
import { P_NOTES } from '@/lib/placeholder-data';

let mockNotes: Note[] = [...P_NOTES];

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

export const noteMockService = {
  async getAll(): Promise<Note[]> {
    await delay();
    return [...mockNotes];
  },

  async create(note: Omit<Note, 'id'>): Promise<Note> {
    await delay();
    const newNote: Note = { ...note, id: `note-${Date.now()}` };
    mockNotes = [newNote, ...mockNotes];
    return newNote;
  },

  async update(id: string, updates: Partial<Note>): Promise<Note> {
    await delay();
    const index = mockNotes.findIndex((n) => n.id === id);
    if (index === -1) throw new Error(`Note ${id} not found`);
    mockNotes[index] = { ...mockNotes[index], ...updates };
    return mockNotes[index];
  },

  async delete(id: string): Promise<void> {
    await delay();
    mockNotes = mockNotes.filter((n) => n.id !== id);
  },
};
