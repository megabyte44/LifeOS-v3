import { apiClient } from '@/lib/api-client';
import type { AiChatRequest, AiChatResponse } from './mock/ai-chat.mock';
import type { ConversationMemoryItem } from '@/types';

export const aiChatApiService = {
  async sendMessage(request: AiChatRequest): Promise<AiChatResponse> {
    return apiClient.post<AiChatResponse>('/ai/chat', request);
  },

  async getMemories(): Promise<ConversationMemoryItem[]> {
    return apiClient.get<ConversationMemoryItem[]>('/ai/memories');
  },

  async deleteMemory(id: string): Promise<void> {
    return apiClient.delete<void>(`/ai/memories/${id}`);
  },
};

export type { AiChatRequest, AiChatResponse };
