import { User, type IUser } from '../models/user.model';
import { problemSourceFactory } from '../problem-sources/problem-source.factory';
import { NotFoundError, ValidationError } from '../utils/errors';
import type { UpdateSettingsBody } from '../types/api.types';

export class UserService {
  async linkLeetCode(userId: string, username: string): Promise<IUser> {
    const source = await problemSourceFactory.getActiveSource();
    const profile = await source.checkUserProfile(username);

    if (!profile.exists) {
      throw new ValidationError(`LeetCode user "${username}" not found`);
    }

    if (!profile.isPublic) {
      throw new ValidationError(`LeetCode profile "${username}" is not public. Please make your profile public to enable submission tracking.`);
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { leetcodeUsername: username, leetcodeVerified: true },
      { new: true }
    ).select('-passwordHash');

    if (!user) throw new NotFoundError('User not found');
    return user;
  }

  async updateSettings(userId: string, settings: UpdateSettingsBody): Promise<IUser> {
    const updateFields: Record<string, any> = {};

    if (settings.difficulty) updateFields['settings.difficulty'] = settings.difficulty;
    if (settings.problemsPerDay) updateFields['settings.problemsPerDay'] = settings.problemsPerDay;
    if (settings.timezone) updateFields['settings.timezone'] = settings.timezone;
    if (settings.mixRatio) updateFields['settings.mixRatio'] = settings.mixRatio;

    const user = await User.findByIdAndUpdate(userId, updateFields, { new: true }).select('-passwordHash');
    if (!user) throw new NotFoundError('User not found');
    return user;
  }

  async updateReminderSettings(
    userId: string,
    template: string,
    customTimes?: string[]
  ): Promise<IUser> {
    const update: Record<string, any> = { reminderTemplate: template };
    if (template === 'custom' && customTimes) {
      update.customReminderTimes = customTimes;
    }

    const user = await User.findByIdAndUpdate(userId, update, { new: true }).select('-passwordHash');
    if (!user) throw new NotFoundError('User not found');
    return user;
  }

  async completeOnboarding(userId: string): Promise<IUser> {
    const user = await User.findByIdAndUpdate(
      userId,
      { onboardingComplete: true },
      { new: true }
    ).select('-passwordHash');
    if (!user) throw new NotFoundError('User not found');
    return user;
  }

  async getProfile(userId: string): Promise<IUser> {
    const user = await User.findById(userId).select('-passwordHash');
    if (!user) throw new NotFoundError('User not found');
    return user;
  }
}

export const userService = new UserService();
