import { useMutation } from '@tanstack/react-query';
import { pushService } from '@/services';
import type { PushSubscribeRequest } from '@/services';

export function usePush() {
  const subscribe = useMutation({
    mutationFn: (request: PushSubscribeRequest) => pushService.subscribe(request),
  });

  const unsubscribe = useMutation({
    mutationFn: (endpoint: string) => pushService.unsubscribe(endpoint),
  });

  const sendTest = useMutation({
    mutationFn: () => pushService.sendTest(),
  });

  return {
    subscribe: subscribe.mutateAsync,
    unsubscribe: unsubscribe.mutateAsync,
    sendTest: sendTest.mutateAsync,
    isSubscribing: subscribe.isPending,
    isUnsubscribing: unsubscribe.isPending,
    isSendingTest: sendTest.isPending,
  };
}
