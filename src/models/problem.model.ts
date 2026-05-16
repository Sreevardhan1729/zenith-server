import mongoose, { Schema, Document } from 'mongoose';
import type { Difficulty } from '../types';

export interface IProblem extends Document {
  leetcodeId: number;
  titleSlug: string;
  title: string;
  difficulty: Difficulty;
  topicTags: string[];
  acRate: number;
  isPaidOnly: boolean;
  sourceApi: string;
  lastFetchedAt: Date;
  createdAt: Date;
}

const problemSchema = new Schema<IProblem>(
  {
    leetcodeId: { type: Number, required: true },
    titleSlug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
    topicTags: { type: [String], default: [] },
    acRate: { type: Number, default: 0 },
    isPaidOnly: { type: Boolean, default: false },
    sourceApi: { type: String, default: 'alfa-leetcode' },
    lastFetchedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

problemSchema.index({ titleSlug: 1 });
problemSchema.index({ difficulty: 1 });

export const Problem = mongoose.models.Problem || mongoose.model<IProblem>('Problem', problemSchema);
