import type { VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import type { AuthenticatedRequest } from '../types/api.types';
import type { JwtPayload } from '../types';

export async function authMiddleware(
  req: AuthenticatedRequest,
  res: VercelResponse
): Promise<boolean> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Missing or invalid authorization header' });
    return false;
  }

  const token = authHeader.substring(7);

  try {
    const payload = jwt.verify(token, config.jwt.secret) as JwtPayload;
    req.user = payload;
    return true;
  } catch {
    res.status(401).json({ success: false, error: 'Invalid or expired token' });
    return false;
  }
}
