import { apiClient } from '@/lib/api-client';
import type { AiChatRequest, AiChatResponse } from './mock/ai-chat.mock';
import type { ConversationMemoryItem } from '@/types';

export const aiChatApiService = {
  async sendMessage(request: AiChatRequest): Promise<AiChatResponse> {
    return apiClient.post<AiChatResponse>('/api/ai/chat', request);
  },

  async getMemories(): Promise<ConversationMemoryItem[]> {
    return apiClient.get<ConversationMemoryItem[]>('/api/ai/memories');
  },

  async deleteMemory(id: string): Promise<void> {
    return apiClient.delete<void>(`/api/ai/memories/${id}`);
  },
};

export type { AiChatRequest, AiChatResponse };
