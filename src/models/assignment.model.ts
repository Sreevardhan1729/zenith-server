import mongoose, { Schema, Document, Types } from 'mongoose';
import type { AssignmentStatus, SolvedVia } from '../types';

export interface IAssignment extends Document {
  userId: Types.ObjectId;
  problemId: Types.ObjectId;
  assignedDate: string;
  status: AssignmentStatus;
  solvedAt: Date | null;
  solvedVia: SolvedVia | null;
  carriedFromDate: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const assignmentSchema = new Schema<IAssignment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    problemId: { type: Schema.Types.ObjectId, ref: 'Problem', required: true },
    assignedDate: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'solved', 'skipped', 'carried_over'],
      default: 'pending',
    },
    solvedAt: { type: Date, default: null },
    solvedVia: { type: String, enum: ['auto_detected', 'manual', null], default: null },
    carriedFromDate: { type: String, default: null },
  },
  { timestamps: true }
);

assignmentSchema.index({ userId: 1, assignedDate: -1 });
assignmentSchema.index({ userId: 1, status: 1 });

export const Assignment =
  mongoose.models.Assignment || mongoose.model<IAssignment>('Assignment', assignmentSchema);
