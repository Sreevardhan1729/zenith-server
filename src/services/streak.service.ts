import { Assignment } from '../models/assignment.model';
import { User } from '../models/user.model';
import { getTodayDateString } from '../utils/timezone';
import { subDays, format } from 'date-fns';

export class StreakService {
  async updateStreak(userId: string): Promise<{ current: number; longest: number }> {
    const user = await User.findById(userId);
    if (!user) return { current: 0, longest: 0 };

    const today = getTodayDateString(user.settings.timezone);

    const todayAssignments = await Assignment.find({
      userId,
      assignedDate: today,
    });

    const allSolvedToday = todayAssignments.length > 0 &&
      todayAssignments.every((a) => a.status === 'solved');

    if (!allSolvedToday) {
      return { current: user.streakCurrent, longest: user.streakLongest };
    }

    if (user.lastActiveDate === today) {
      return { current: user.streakCurrent, longest: user.streakLongest };
    }

    let streak = 1;
    let checkDate = new Date();

    for (let i = 1; i <= 365; i++) {
      checkDate = subDays(new Date(), i);
      const dateStr = format(checkDate, 'yyyy-MM-dd');

      const dayAssignments = await Assignment.find({
        userId,
        assignedDate: dateStr,
      });

      if (dayAssignments.length === 0) break;

      const allSolved = dayAssignments.every((a) => a.status === 'solved');
      if (!allSolved) break;

      streak++;
    }

    const longest = Math.max(streak, user.streakLongest);

    await User.findByIdAndUpdate(userId, {
      streakCurrent: streak,
      streakLongest: longest,
      lastActiveDate: today,
    });

    return { current: streak, longest };
  }

  async getStreak(userId: string): Promise<{ current: number; longest: number }> {
    const user = await User.findById(userId);
    if (!user) return { current: 0, longest: 0 };
    return { current: user.streakCurrent, longest: user.streakLongest };
  }
}

export const streakService = new StreakService();
