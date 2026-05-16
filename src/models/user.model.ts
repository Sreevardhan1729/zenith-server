import mongoose, { Schema, Document } from 'mongoose';
import type { Difficulty, ReminderTemplate } from '../types';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  leetcodeUsername: string | null;
  leetcodeVerified: boolean;
  settings: {
    difficulty: Difficulty | 'Mixed';
    problemsPerDay: number;
    timezone: string;
    mixRatio: {
      easy: number;
      medium: number;
      hard: number;
    };
  };
  reminderTemplate: ReminderTemplate;
  customReminderTimes: string[];
  onboardingComplete: boolean;
  streakCurrent: number;
  streakLongest: number;
  lastActiveDate: string | null;
  authProviders: {
    google?: string;
    github?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    leetcodeUsername: { type: String, default: null },
    leetcodeVerified: { type: Boolean, default: false },
    settings: {
      difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard', 'Mixed'], default: 'Hard' },
      problemsPerDay: { type: Number, default: 1, min: 1, max: 5 },
      timezone: { type: String, default: 'UTC' },
      mixRatio: {
        easy: { type: Number, default: 1 },
        medium: { type: Number, default: 2 },
        hard: { type: Number, default: 2 },
      },
    },
    reminderTemplate: {
      type: String,
      enum: ['gentle', 'moderate', 'aggressive', 'custom'],
      default: 'moderate',
    },
    customReminderTimes: { type: [String], default: [] },
    onboardingComplete: { type: Boolean, default: false },
    streakCurrent: { type: Number, default: 0 },
    streakLongest: { type: Number, default: 0 },
    lastActiveDate: { type: String, default: null },
    authProviders: {
      google: { type: String, default: undefined },
      github: { type: String, default: undefined },
    },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 });

export const User = mongoose.models.User || mongoose.model<IUser>('User', userSchema);
