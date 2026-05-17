import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB } from '../../src/config/database';
import { authMiddleware } from '../../src/middleware/auth.middleware';
import { assignmentService } from '../../src/services/assignment.service';
import { streakService } from '../../src/services/streak.service';
import { AppError } from '../../src/utils/errors';
import type { AuthenticatedRequest } from '../../src/types/api.types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await connectDB();

    const authed = await authMiddleware(req as AuthenticatedRequest, res);
    if (!authed) return;

    const userId = (req as AuthenticatedRequest).user!.sub;

    // Extract path from catch-all route param or URL
    const pathParam = req.query.path;
    let path: string;
    if (pathParam && (Array.isArray(pathParam) ? pathParam.length > 0 : pathParam.length > 0)) {
      path = Array.isArray(pathParam) ? pathParam.join('/') : pathParam;
    } else {
      path = (req.url || '').replace(/^\/api\/problems\/?/, '').split('?')[0];
    }

    // POST /problems/assign
    if (req.method === 'POST' && path === 'assign') {
      const assignments = await assignmentService.assignDaily(userId);
      return res.status(200).json({ success: true, data: { assignments } });
    }

    // GET /problems/today
    if (req.method === 'GET' && path === 'today') {
      const assignments = await assignmentService.getToday(userId);
      return res.status(200).json({ success: true, data: { assignments } });
    }

    // GET /problems/history
    if (req.method === 'GET' && (path === 'history' || path.startsWith('history'))) {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 30;
      const { assignments, total } = await assignmentService.getHistory(userId, page, limit);
      return res.status(200).json({
        success: true,
        data: { assignments, total, page, totalPages: Math.ceil(total / limit) },
      });
    }

    // POST /problems/solve, /problems/skip, /problems/carry-over (ID in body)
    if (req.method === 'POST' && path === 'solve') {
      const { assignmentId } = req.body || {};
      if (!assignmentId) return res.status(400).json({ success: false, error: 'assignmentId required' });
      const assignment = await assignmentService.markSolved(userId, assignmentId);
      await streakService.updateStreak(userId);
      return res.status(200).json({ success: true, data: { assignment } });
    }

    if (req.method === 'POST' && path === 'skip') {
      const { assignmentId } = req.body || {};
      if (!assignmentId) return res.status(400).json({ success: false, error: 'assignmentId required' });
      const assignment = await assignmentService.markSkipped(userId, assignmentId);
      return res.status(200).json({ success: true, data: { assignment } });
    }

    if (req.method === 'POST' && path === 'carry-over') {
      const { assignmentId } = req.body || {};
      if (!assignmentId) return res.status(400).json({ success: false, error: 'assignmentId required' });
      const assignment = await assignmentService.carryOver(userId, assignmentId);
      return res.status(200).json({ success: true, data: { assignment } });
    }

    return res.status(404).json({ success: false, error: `Not found: ${req.method} ${path}` });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ success: false, error: error.message });
    }
    console.error('Problems error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
