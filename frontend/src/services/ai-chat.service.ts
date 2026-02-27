import { apiClient } from '@/lib/api-client';
import type { AiChatRequest, AiChatResponse } from './mock/ai-chat.mock';

export const aiChatApiService = {
  async sendMessage(request: AiChatRequest): Promise<AiChatResponse> {
    return apiClient.post<AiChatResponse>('/api/ai/chat', request);
  },
};

export type { AiChatRequest, AiChatResponse };
