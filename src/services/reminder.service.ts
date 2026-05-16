import { User } from '../models/user.model';
import { Assignment } from '../models/assignment.model';
import { ReminderLog } from '../models/reminder-log.model';
import { channelFactory } from '../notification-channels/channel.factory';
import { submissionCheckerService } from './submission-checker.service';
import { getCurrentHHMM, getReminderTimes, isWithinWindow } from '../utils/timezone';

export class ReminderService {
  async processReminders(): Promise<{ checked: number; notified: number }> {
    // Step 1: Check submissions first to avoid notifying users who already solved
    await submissionCheckerService.checkAllPending();

    // Step 2: Find users who still have pending assignments and need reminders now
    const users = await User.find({
      onboardingComplete: true,
      leetcodeVerified: true,
    });

    let notified = 0;

    for (const user of users) {
      const currentTime = getCurrentHHMM(user.settings.timezone);
      const reminderTimes = getReminderTimes(user.reminderTemplate, user.customReminderTimes);

      const shouldNotify = reminderTimes.some((time) => isWithinWindow(currentTime, time, 3));
      if (!shouldNotify) continue;

      const pendingAssignments = await Assignment.find({
        userId: user._id,
        status: 'pending',
      }).populate('problemId');

      if (pendingAssignments.length === 0) continue;

      const matchedTime = reminderTimes.find((time) => isWithinWindow(currentTime, time, 3)) || currentTime;

      const alreadySent = await ReminderLog.findOne({
        userId: user._id,
        assignmentId: pendingAssignments[0]._id,
        scheduledTime: matchedTime,
      });

      if (alreadySent) continue;

      const problemNames = pendingAssignments
        .map((a: any) => a.problemId?.title || 'Unknown')
        .join(', ');

      const results = await channelFactory.notifyUser(user._id.toString(), {
        title: 'Zenith - Time to solve!',
        body: `You have ${pendingAssignments.length} problem(s) waiting: ${problemNames}`,
        data: {
          type: 'reminder',
          assignmentId: pendingAssignments[0]._id.toString(),
        },
      });

      await ReminderLog.create({
        userId: user._id,
        assignmentId: pendingAssignments[0]._id,
        channel: 'fcm',
        status: results.some((r) => r.success) ? 'sent' : 'failed',
        scheduledTime: matchedTime,
      });

      if (results.some((r) => r.success)) notified++;
    }

    return { checked: users.length, notified };
  }
}

export const reminderService = new ReminderService();
