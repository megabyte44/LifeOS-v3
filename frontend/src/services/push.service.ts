import { apiClient } from '@/lib/api-client';
import type { PushSubscribeRequest } from './mock/push.mock';

export const pushApiService = {
  async subscribe(request: PushSubscribeRequest): Promise<{ success: boolean; message: string }> {
    return apiClient.post('/push/subscribe', request);
  },

  async unsubscribe(endpoint: string): Promise<{ success: boolean; message: string }> {
    return apiClient.post('/push/unsubscribe', { endpoint });
  },

  async sendTest(): Promise<{ success: boolean; message: string }> {
    return apiClient.post('/push/send-test');
  },
};
