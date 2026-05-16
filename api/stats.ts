import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB } from '../src/config/database';
import { authMiddleware } from '../src/middleware/auth.middleware';
import { streakService } from '../src/services/streak.service';
import { AppError } from '../src/utils/errors';
import type { AuthenticatedRequest } from '../src/types/api.types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await connectDB();

    const authed = await authMiddleware(req as AuthenticatedRequest, res);
    if (!authed) return;

    const userId = (req as AuthenticatedRequest).user!.sub;
    const path = (req.url || '').replace(/^\/api\/stats\/?/, '').split('?')[0];

    if (req.method === 'GET' && path === 'streak') {
      const streak = await streakService.getStreak(userId);
      return res.status(200).json({ success: true, data: streak });
    }

    return res.status(404).json({ success: false, error: 'Not found' });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ success: false, error: error.message });
    }
    console.error('Stats error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
