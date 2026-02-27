const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

export interface PushSubscribeRequest {
  subscription: PushSubscriptionJSON;
}

export const pushMockService = {
  async subscribe(_request: PushSubscribeRequest): Promise<{ success: boolean; message: string }> {
    await delay();
    return { success: true, message: 'Mock: Push subscription saved.' };
  },

  async unsubscribe(endpoint: string): Promise<{ success: boolean; message: string }> {
    await delay();
    void endpoint;
    return { success: true, message: 'Mock: Push subscription removed.' };
  },

  async sendTest(): Promise<{ success: boolean; message: string }> {
    await delay();
    return { success: true, message: 'Mock: Test notification sent.' };
  },
};
