import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB } from '../src/config/database';
import { authMiddleware } from '../src/middleware/auth.middleware';
import { assignmentService } from '../src/services/assignment.service';
import { streakService } from '../src/services/streak.service';
import { AppError } from '../src/utils/errors';
import type { AuthenticatedRequest } from '../src/types/api.types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await connectDB();

    const authed = await authMiddleware(req as AuthenticatedRequest, res);
    if (!authed) return;

    const userId = (req as AuthenticatedRequest).user!.sub;
    const path = (req.url || '').replace(/^\/api\/problems\/?/, '').split('?')[0];

    if (req.method === 'POST' && path === 'assign') {
      const assignments = await assignmentService.assignDaily(userId);
      return res.status(200).json({ success: true, data: { assignments } });
    }

    if (req.method === 'GET' && path === 'today') {
      const assignments = await assignmentService.getToday(userId);
      return res.status(200).json({ success: true, data: { assignments } });
    }

    if (req.method === 'GET' && path === 'history') {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 30;
      const { assignments, total } = await assignmentService.getHistory(userId, page, limit);
      return res.status(200).json({
        success: true,
        data: { assignments, total, page, totalPages: Math.ceil(total / limit) },
      });
    }

    // Handle /problems/:id/solve, /problems/:id/skip, /problems/:id/carry-over
    const idMatch = path.match(/^([a-f0-9]{24})\/(solve|skip|carry-over)$/);
    if (req.method === 'POST' && idMatch) {
      const [, assignmentId, action] = idMatch;

      if (action === 'solve') {
        const assignment = await assignmentService.markSolved(userId, assignmentId);
        await streakService.updateStreak(userId);
        return res.status(200).json({ success: true, data: { assignment } });
      }

      if (action === 'skip') {
        const assignment = await assignmentService.markSkipped(userId, assignmentId);
        return res.status(200).json({ success: true, data: { assignment } });
      }

      if (action === 'carry-over') {
        const assignment = await assignmentService.carryOver(userId, assignmentId);
        return res.status(200).json({ success: true, data: { assignment } });
      }
    }

    return res.status(404).json({ success: false, error: 'Not found' });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ success: false, error: error.message });
    }
    console.error('Problems error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
