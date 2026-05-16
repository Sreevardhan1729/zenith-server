export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface NotificationResult {
  success: boolean;
  error?: string;
}

export interface NotificationChannel {
  readonly channelId: string;

  send(userId: string, payload: NotificationPayload): Promise<NotificationResult>;
  sendBatch(userIds: string[], payload: NotificationPayload): Promise<NotificationResult[]>;
  isAvailable(userId: string): Promise<boolean>;
}
