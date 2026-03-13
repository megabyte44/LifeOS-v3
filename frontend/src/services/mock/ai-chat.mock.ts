const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

export interface AiChatRequest {
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[];
  personality?: string;
  model?: string;
  mode?: 'normal' | 'chat_buddy';
}

export interface AiChatResponse {
  result: string;
  model?: string;
}

export const aiChatMockService = {
  async sendMessage(request: AiChatRequest): Promise<AiChatResponse> {
    await delay(800);
    const lastMessage = request.messages[request.messages.length - 1]?.content ?? '';
    return {
      result: `[Mock AI] I received your message: "${lastMessage.slice(0, 50)}${lastMessage.length > 50 ? '...' : ''}". This is a simulated response. Connect a real backend to get actual AI responses.`,
      model: 'mock-model',
    };
  },
};
