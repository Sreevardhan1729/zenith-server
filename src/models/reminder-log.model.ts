import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IReminderLog extends Document {
  userId: Types.ObjectId;
  assignmentId: Types.ObjectId;
  sentAt: Date;
  channel: string;
  status: 'sent' | 'failed' | 'delivered';
  scheduledTime: string;
}

const reminderLogSchema = new Schema<IReminderLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    assignmentId: { type: Schema.Types.ObjectId, ref: 'Assignment', required: true },
    sentAt: { type: Date, default: Date.now },
    channel: { type: String, required: true },
    status: { type: String, enum: ['sent', 'failed', 'delivered'], default: 'sent' },
    scheduledTime: { type: String, required: true },
  },
  { timestamps: true }
);

reminderLogSchema.index({ userId: 1, assignmentId: 1, scheduledTime: 1 });

export const ReminderLog =
  mongoose.models.ReminderLog || mongoose.model<IReminderLog>('ReminderLog', reminderLogSchema);
