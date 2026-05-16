import type { NotificationChannel, NotificationPayload, NotificationResult } from './notification-channel.interface';
import { FCMChannel } from './fcm.channel';

class ChannelFactory {
  private channels: Map<string, NotificationChannel> = new Map();

  constructor() {
    this.register(new FCMChannel());
  }

  register(channel: NotificationChannel): void {
    this.channels.set(channel.channelId, channel);
  }

  getChannel(id: string): NotificationChannel | undefined {
    return this.channels.get(id);
  }

  async getAllActiveChannels(userId: string): Promise<NotificationChannel[]> {
    const active: NotificationChannel[] = [];
    for (const channel of this.channels.values()) {
      const available = await channel.isAvailable(userId);
      if (available) active.push(channel);
    }
    return active;
  }

  async notifyUser(userId: string, payload: NotificationPayload): Promise<NotificationResult[]> {
    const activeChannels = await this.getAllActiveChannels(userId);
    const results: NotificationResult[] = [];

    for (const channel of activeChannels) {
      const result = await channel.send(userId, payload);
      results.push(result);
    }

    return results;
  }
}

export const channelFactory = new ChannelFactory();
