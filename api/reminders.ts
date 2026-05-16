import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB } from '../src/config/database';
import { authMiddleware } from '../src/middleware/auth.middleware';
import { userService } from '../src/services/user.service';
import { DeviceToken } from '../src/models/device-token.model';
import { validate, updateReminderSettingsSchema, registerTokenSchema } from '../src/utils/validators';
import { AppError } from '../src/utils/errors';
import type { AuthenticatedRequest } from '../src/types/api.types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await connectDB();

    const authed = await authMiddleware(req as AuthenticatedRequest, res);
    if (!authed) return;

    const userId = (req as AuthenticatedRequest).user!.sub;
    const path = (req.url || '').replace(/^\/api\/reminders\/?/, '').split('?')[0];

    if (path === 'settings') {
      if (req.method === 'GET') {
        const user = await userService.getProfile(userId);
        return res.status(200).json({
          success: true,
          data: { template: user.reminderTemplate, customTimes: user.customReminderTimes },
        });
      }
      if (req.method === 'PUT') {
        const { template, customTimes } = validate(updateReminderSettingsSchema, req.body);
        const user = await userService.updateReminderSettings(userId, template, customTimes);
        return res.status(200).json({
          success: true,
          data: { template: user.reminderTemplate, customTimes: user.customReminderTimes },
        });
      }
    }

    if (path === 'register-token') {
      if (req.method === 'POST') {
        const { token, platform } = validate(registerTokenSchema, req.body);
        await DeviceToken.findOneAndUpdate(
          { token },
          { userId, token, platform, isActive: true, lastUsedAt: new Date() },
          { upsert: true, new: true }
        );
        return res.status(200).json({ success: true, message: 'Device token registered' });
      }
      if (req.method === 'DELETE') {
        const { token } = req.body || {};
        if (token) await DeviceToken.findOneAndUpdate({ token }, { isActive: false });
        return res.status(200).json({ success: true, message: 'Device token deactivated' });
      }
    }

    return res.status(404).json({ success: false, error: 'Not found' });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ success: false, error: error.message });
    }
    console.error('Reminders error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
