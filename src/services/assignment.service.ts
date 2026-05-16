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

    const existing = await Assignment.find({ userId, assignedDate: today }).populate('problemId');
    if (existing.length > 0) {
      return existing;
    }

    const difficulties = this.getDifficulties(
      user.settings.difficulty,
      user.settings.problemsPerDay,
      user.settings.mixRatio
    );

    const assignments: IAssignment[] = [];

    for (const difficulty of difficulties) {
      const problem = await this.pickProblem(userId, difficulty);
      if (problem) {
        const assignment = await Assignment.create({
          userId,
          problemId: problem._id,
          assignedDate: today,
          status: 'pending',
        });
        assignments.push(assignment);
      }
    }

    return Assignment.find({ userId, assignedDate: today }).populate('problemId');
  }

  async getToday(userId: string): Promise<IAssignment[]> {
    const user = await User.findById(userId);
    if (!user) throw new NotFoundError('User not found');

    const today = getTodayDateString(user.settings.timezone);
    return Assignment.find({ userId, assignedDate: today }).populate('problemId');
  }

  async markSolved(userId: string, assignmentId: string): Promise<IAssignment> {
    const assignment = await Assignment.findOne({ _id: assignmentId, userId });
    if (!assignment) throw new NotFoundError('Assignment not found');

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
    const skip = (page - 1) * limit;
    const [assignments, total] = await Promise.all([
      Assignment.find({ userId })
        .sort({ assignedDate: -1 })
        .skip(skip)
        .limit(limit)
        .populate('problemId'),
      Assignment.countDocuments({ userId }),
    ]);

    return { assignments, total };
  }

  async getPendingAssignments(): Promise<IAssignment[]> {
    return Assignment.find({ status: 'pending' }).populate('problemId');
  }

  private async pickProblem(userId: string, difficulty: Difficulty): Promise<IProblem | null> {
    const previousSlugs = await Assignment.find({ userId })
      .distinct('problemId')
      .then(async (ids) => {
        const problems = await Problem.find({ _id: { $in: ids } });
        return problems.map((p) => p.titleSlug);
      });

    let problem = await Problem.findOne({
      difficulty,
      titleSlug: { $nin: previousSlugs },
      isPaidOnly: false,
    });

    if (!problem) {
      const source = await problemSourceFactory.getActiveSource();
      const fetched = await source.fetchProblems({ difficulty, limit: 50 });

      const newProblems = fetched.filter((p) => !previousSlugs.includes(p.titleSlug) && !p.isPaidOnly);

      if (newProblems.length === 0) return null;

      const randomPick = newProblems[Math.floor(Math.random() * newProblems.length)];

      problem = await Problem.findOneAndUpdate(
        { titleSlug: randomPick.titleSlug },
        {
          leetcodeId: randomPick.leetcodeId,
          titleSlug: randomPick.titleSlug,
          title: randomPick.title,
          difficulty: randomPick.difficulty,
          topicTags: randomPick.topicTags,
          acRate: randomPick.acRate,
          isPaidOnly: randomPick.isPaidOnly,
          sourceApi: source.sourceId,
          lastFetchedAt: new Date(),
        },
        { upsert: true, new: true }
      );
    }

    return problem;
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
