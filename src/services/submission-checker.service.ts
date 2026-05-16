import { Assignment } from '../models/assignment.model';
import { Problem } from '../models/problem.model';
import { User } from '../models/user.model';
import { problemSourceFactory } from '../problem-sources/problem-source.factory';
import { streakService } from './streak.service';

export class SubmissionCheckerService {
  async checkAllPending(): Promise<{ checked: number; solved: number }> {
    const pendingAssignments = await Assignment.find({ status: 'pending' }).populate('problemId');

    const userAssignments = new Map<string, typeof pendingAssignments>();
    for (const assignment of pendingAssignments) {
      const userId = assignment.userId.toString();
      if (!userAssignments.has(userId)) {
        userAssignments.set(userId, []);
      }
      userAssignments.get(userId)!.push(assignment);
    }

    let checked = 0;
    let solved = 0;
    const source = await problemSourceFactory.getActiveSource();

    for (const [userId, assignments] of userAssignments) {
      const user = await User.findById(userId);
      if (!user || !user.leetcodeUsername) continue;

      checked++;

      try {
        const submissions = await source.getRecentSubmissions(user.leetcodeUsername, 30);

        for (const assignment of assignments) {
          const problem = assignment.problemId as any;
          if (!problem) continue;

          const wasSolved = submissions.some(
            (s) =>
              s.titleSlug === problem.titleSlug &&
              s.statusDisplay === 'Accepted' &&
              s.timestamp > Math.floor(new Date(assignment.createdAt).getTime() / 1000)
          );

          if (wasSolved) {
            assignment.status = 'solved';
            assignment.solvedAt = new Date();
            assignment.solvedVia = 'auto_detected';
            await assignment.save();
            await streakService.updateStreak(userId);
            solved++;
          }
        }
      } catch {
        // Skip user on API failure, will retry next cron run
      }
    }

    return { checked, solved };
  }
}

export const submissionCheckerService = new SubmissionCheckerService();
