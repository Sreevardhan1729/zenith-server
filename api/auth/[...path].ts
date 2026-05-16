import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB } from '../../src/config/database';
import { authService } from '../../src/services/auth.service';
import { authMiddleware } from '../../src/middleware/auth.middleware';
import { validate, registerSchema, loginSchema } from '../../src/utils/validators';
import { AppError, ValidationError, NotFoundError } from '../../src/utils/errors';
import type { AuthenticatedRequest } from '../../src/types/api.types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await connectDB();

    const pathParam = req.query.path;
    const path = Array.isArray(pathParam) ? pathParam.join('/') : (pathParam || '');

    if (req.method === 'POST' && path === 'register') {
      const { email, password } = validate(registerSchema, req.body);
      const { user, tokens } = await authService.register(email, password);
      return res.status(201).json({
        success: true,
        data: { user: authService.sanitizeUser(user), ...tokens },
      });
    }

    if (req.method === 'POST' && path === 'login') {
      const { email, password } = validate(loginSchema, req.body);
      const { user, tokens } = await authService.login(email, password);
      return res.status(200).json({
        success: true,
        data: { user: authService.sanitizeUser(user), ...tokens },
      });
    }

    if (req.method === 'POST' && path === 'refresh') {
      const { refreshToken } = req.body || {};
      if (!refreshToken) throw new ValidationError('Refresh token is required');
      const tokens = await authService.refreshToken(refreshToken);
      return res.status(200).json({ success: true, data: tokens });
    }

    if (req.method === 'GET' && path === 'me') {
      const authed = await authMiddleware(req as AuthenticatedRequest, res);
      if (!authed) return;
      const user = await authService.getUserById((req as AuthenticatedRequest).user!.sub);
      if (!user) throw new NotFoundError('User not found');
      return res.status(200).json({ success: true, data: { user } });
    }

    return res.status(404).json({ success: false, error: 'Not found' });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ success: false, error: error.message });
    }
    console.error('Auth error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
