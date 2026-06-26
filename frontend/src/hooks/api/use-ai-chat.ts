import { useMutation } from '@tanstack/react-query';
import { aiChatService } from '@/services';
import type { AiChatRequest, AiChatResponse } from '@/services';

export function useAiChat() {
  const sendMessage = useMutation({
    mutationFn: (request: AiChatRequest) => aiChatService.sendMessage(request),
  });

  return {
    sendMessage: sendMessage.mutateAsync,
    isLoading: sendMessage.isPending,
    error: sendMessage.error,
    lastResponse: sendMessage.data as AiChatResponse | undefined,
    reset: sendMessage.reset,
  };
}
