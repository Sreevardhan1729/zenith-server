import * as admin from 'firebase-admin';
import { getFirebaseAdmin } from '../config/firebase';
import { DeviceToken } from '../models/device-token.model';
import type { NotificationChannel, NotificationPayload, NotificationResult } from './notification-channel.interface';

export class FCMChannel implements NotificationChannel {
  readonly channelId = 'fcm';

  async send(userId: string, payload: NotificationPayload): Promise<NotificationResult> {
    const tokens = await DeviceToken.find({ userId, isActive: true });

    if (tokens.length === 0) {
      return { success: false, error: 'No active device tokens' };
    }

    const app = getFirebaseAdmin();
    const messaging = admin.messaging(app);

    const message: admin.messaging.MulticastMessage = {
      tokens: tokens.map((t) => t.token),
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data,
    };

    const response = await messaging.sendEachForMulticast(message);

    const failedTokens: string[] = [];
    response.responses.forEach((resp, idx) => {
      if (!resp.success && resp.error?.code === 'messaging/registration-token-not-registered') {
        failedTokens.push(tokens[idx].token);
      }
    });

    if (failedTokens.length > 0) {
      await DeviceToken.updateMany(
        { token: { $in: failedTokens } },
        { isActive: false }
      );
    }

    return {
      success: response.successCount > 0,
      error: response.failureCount > 0 ? `${response.failureCount} delivery failures` : undefined,
    };
  }

  async sendBatch(userIds: string[], payload: NotificationPayload): Promise<NotificationResult[]> {
    const results: NotificationResult[] = [];
    for (const userId of userIds) {
      const result = await this.send(userId, payload);
      results.push(result);
    }
    return results;
  }

  async isAvailable(userId: string): Promise<boolean> {
    const count = await DeviceToken.countDocuments({ userId, isActive: true });
    return count > 0;
  }
}
