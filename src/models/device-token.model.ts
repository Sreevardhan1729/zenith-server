import mongoose, { Schema, Document, Types } from 'mongoose';
import type { Platform } from '../types';

export interface IDeviceToken extends Document {
  userId: Types.ObjectId;
  token: string;
  platform: Platform;
  isActive: boolean;
  lastUsedAt: Date;
  createdAt: Date;
}

const deviceTokenSchema = new Schema<IDeviceToken>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    token: { type: String, required: true },
    platform: { type: String, enum: ['ios', 'android', 'web', 'macos'], required: true },
    isActive: { type: Boolean, default: true },
    lastUsedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

deviceTokenSchema.index({ userId: 1 });
deviceTokenSchema.index({ token: 1 }, { unique: true });

export const DeviceToken =
  mongoose.models.DeviceToken || mongoose.model<IDeviceToken>('DeviceToken', deviceTokenSchema);
