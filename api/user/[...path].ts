import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB } from '../../src/config/database';
import { authMiddleware } from '../../src/middleware/auth.middleware';
import { userService } from '../../src/services/user.service';
import { validate, linkLeetCodeSchema, updateSettingsSchema } from '../../src/utils/validators';
import { AppError } from '../../src/utils/errors';
import type { AuthenticatedRequest } from '../../src/types/api.types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await connectDB();

    const authed = await authMiddleware(req as AuthenticatedRequest, res);
    if (!authed) return;

    const userId = (req as AuthenticatedRequest).user!.sub;
    const pathParam = req.query.path;
    const path = Array.isArray(pathParam) ? pathParam.join('/') : (pathParam || '');

    if (req.method === 'POST' && path === 'link-leetcode') {
      const { username } = validate(linkLeetCodeSchema, req.body);
      const user = await userService.linkLeetCode(userId, username);
      return res.status(200).json({ success: true, data: { user } });
    }

    if (req.method === 'POST' && path === 'complete-onboarding') {
      const user = await userService.completeOnboarding(userId);
      return res.status(200).json({ success: true, data: { user } });
    }

    if (path === 'profile' && req.method === 'GET') {
      const user = await userService.getProfile(userId);
      return res.status(200).json({ success: true, data: { user } });
    }

    if (path === 'settings') {
      if (req.method === 'GET') {
        const user = await userService.getProfile(userId);
        return res.status(200).json({ success: true, data: { settings: user.settings } });
      }
      if (req.method === 'PUT') {
        const settings = validate(updateSettingsSchema, req.body);
        const user = await userService.updateSettings(userId, settings);
        return res.status(200).json({ success: true, data: { user } });
      }
    }

    return res.status(404).json({ success: false, error: 'Not found' });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ success: false, error: error.message });
    }
    console.error('User error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
