import { Assignment, type IAssignment } from '../models/assignment.model';
import { Problem, type IProblem } from '../models/problem.model';
import { User } from '../models/user.model';
import { problemSourceFactory } from '../problem-sources/problem-source.factory';
import { NotFoundError, ValidationError } from '../utils/errors';
import { getTodayDateString } from '../utils/timezone';
import type { Difficulty } from '../types';

export class AssignmentService {
  async assignDaily(userId: string): Promise<IAssignment[]> {
    const user = await User.findById(userId);
    if (!user) throw new NotFoundError('User not found');
    if (!user.leetcodeUsername || !user.leetcodeVerified) {
      throw new ValidationError('Please link your LeetCode account first');
    }

    const today = getTodayDateString(user.settings.timezone);

    // Check if there are already assignments for today
    const existing = await Assignment.find({ userId, assignedDate: today }).populate('problemId');
    if (existing.length > 0) {
      return existing;
    }

    // Check if there are still-pending assignments from previous days
    const pendingFromOtherDays = await Assignment.find({
      userId,
      status: 'pending',
      assignedDate: { $ne: today },
    }).populate('problemId');

    if (pendingFromOtherDays.length > 0) {
      return pendingFromOtherDays;
    }

    const difficulties = this.getDifficulties(
      user.settings.difficulty,
      user.settings.problemsPerDay,
      user.settings.mixRatio
    );

    for (const difficulty of difficulties) {
      const problem = await this.pickProblem(userId, difficulty);
      if (problem) {
        await Assignment.create({
          userId,
          problemId: problem._id,
          assignedDate: today,
          status: 'pending',
        });
      }
    }

    return Assignment.find({ userId, assignedDate: today }).populate('problemId');
  }

  async getToday(userId: string): Promise<IAssignment[]> {
    const user = await User.findById(userId);
    if (!user) throw new NotFoundError('User not found');

    const today = getTodayDateString(user.settings.timezone);

    // Return today's assignments (all statuses) + any pending from other days
    const assignments = await Assignment.find({
      userId,
      $or: [
        { assignedDate: today },
        { status: 'pending' },
      ],
    }).populate('problemId');

    return assignments;
  }

  async markSolved(userId: string, assignmentId: string): Promise<IAssignment> {
    const assignment = await Assignment.findOne({ _id: assignmentId, userId });
    if (!assignment) throw new NotFoundError('Assignment not found');

    if (assignment.status === 'solved') {
      return assignment;
    }

    assignment.status = 'solved';
    assignment.solvedAt = new Date();
    assignment.solvedVia = 'manual';
    await assignment.save();

    return assignment;
  }

  async markSkipped(userId: string, assignmentId: string): Promise<IAssignment> {
    const assignment = await Assignment.findOne({ _id: assignmentId, userId });
    if (!assignment) throw new NotFoundError('Assignment not found');

    assignment.status = 'skipped';
    await assignment.save();

    return assignment;
  }

  async carryOver(userId: string, assignmentId: string): Promise<IAssignment> {
    const user = await User.findById(userId);
    if (!user) throw new NotFoundError('User not found');

    const original = await Assignment.findOne({ _id: assignmentId, userId });
    if (!original) throw new NotFoundError('Assignment not found');

    original.status = 'carried_over';
    await original.save();

    const today = getTodayDateString(user.settings.timezone);

    const newAssignment = await Assignment.create({
      userId,
      problemId: original.problemId,
      assignedDate: today,
      status: 'pending',
      carriedFromDate: original.assignedDate,
    });

    return newAssignment;
  }

  async getHistory(
    userId: string,
    page: number = 1,
    limit: number = 30
  ): Promise<{ assignments: IAssignment[]; total: number }> {
    const filter = { userId, status: { $in: ['solved', 'skipped', 'carried_over'] } };
    const skip = (page - 1) * limit;

    const [assignments, total] = await Promise.all([
      Assignment.find(filter)
        .sort({ assignedDate: -1 })
        .skip(skip)
        .limit(limit)
        .populate('problemId'),
      Assignment.countDocuments(filter),
    ]);

    return { assignments, total };
  }

  async getPendingAssignments(): Promise<IAssignment[]> {
    return Assignment.find({ status: 'pending' }).populate('problemId');
  }

  private async pickProblem(userId: string, difficulty: Difficulty): Promise<IProblem | null> {
    // Get all problem IDs already assigned to this user
    const assignedProblemIds = await Assignment.find({ userId }).distinct('problemId');

    // Always fetch fresh problems from the API to ensure randomness per user
    const source = await problemSourceFactory.getActiveSource();
    // Use a random skip to get different problems for different users
    const randomSkip = Math.floor(Math.random() * 200);
    const fetched = await source.fetchProblems({ difficulty, limit: 50, skip: randomSkip });

    // Get slugs of problems already assigned to this user
    const assignedProblems = await Problem.find({ _id: { $in: assignedProblemIds } });
    const assignedSlugs = new Set(assignedProblems.map((p) => p.titleSlug));

    // Filter to problems not yet assigned to this user
    const available = fetched.filter((p) => !assignedSlugs.has(p.titleSlug) && !p.isPaidOnly);

    if (available.length === 0) {
      // Try without skip as fallback
      const fallback = await source.fetchProblems({ difficulty, limit: 100 });
      const fallbackAvailable = fallback.filter((p) => !assignedSlugs.has(p.titleSlug) && !p.isPaidOnly);
      if (fallbackAvailable.length === 0) return null;
      const pick = fallbackAvailable[Math.floor(Math.random() * fallbackAvailable.length)];
      return this.upsertProblem(pick, source.sourceId);
    }

    // Pick a random problem from available ones
    const randomPick = available[Math.floor(Math.random() * available.length)];
    return this.upsertProblem(randomPick, source.sourceId);
  }

  private async upsertProblem(problemData: any, sourceId: string): Promise<IProblem | null> {
    const result = await Problem.findOneAndUpdate(
      { titleSlug: problemData.titleSlug },
      {
        leetcodeId: problemData.leetcodeId,
        titleSlug: problemData.titleSlug,
        title: problemData.title,
        difficulty: problemData.difficulty,
        topicTags: problemData.topicTags,
        acRate: problemData.acRate,
        isPaidOnly: problemData.isPaidOnly,
        sourceApi: sourceId,
        lastFetchedAt: new Date(),
      },
      { upsert: true, new: true }
    );
    return result;
  }

  private getDifficulties(
    setting: string,
    count: number,
    mixRatio: { easy: number; medium: number; hard: number }
  ): Difficulty[] {
    if (setting !== 'Mixed') {
      return Array(count).fill(setting as Difficulty);
    }

    const total = mixRatio.easy + mixRatio.medium + mixRatio.hard;
    const difficulties: Difficulty[] = [];

    for (let i = 0; i < count; i++) {
      const rand = Math.random() * total;
      if (rand < mixRatio.easy) difficulties.push('Easy');
      else if (rand < mixRatio.easy + mixRatio.medium) difficulties.push('Medium');
      else difficulties.push('Hard');
    }

    return difficulties;
  }
}

export const assignmentService = new AssignmentService();
