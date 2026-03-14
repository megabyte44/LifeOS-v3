import { apiClient } from '@/lib/api-client';
import type { AiChatRequest, AiChatResponse } from './mock/ai-chat.mock';
import type { ConversationMemoryItem } from '@/types';

export interface AiChatHistoryItem {
  id: string;
  mode: string;
  personality?: string;
  provider?: string;
  model?: string;
  userMessage: string;
  assistantMessage: string;
  createdAt: string;
}

export const aiChatApiService = {
  async sendMessage(request: AiChatRequest): Promise<AiChatResponse> {
    return apiClient.post<AiChatResponse>('/ai/chat', request);
  },

  async getHistory(limit = 100): Promise<AiChatHistoryItem[]> {
    return apiClient.get<AiChatHistoryItem[]>(`/ai/chat/history?limit=${limit}`);
  },

  async clearHistory(): Promise<void> {
    return apiClient.delete<void>('/ai/chat/history');
  },

  async getMemories(): Promise<ConversationMemoryItem[]> {
    return apiClient.get<ConversationMemoryItem[]>('/ai/memories');
  },

  async deleteMemory(id: string): Promise<void> {
    return apiClient.delete<void>(`/ai/memories/${id}`);
  },
};

export type { AiChatRequest, AiChatResponse };
