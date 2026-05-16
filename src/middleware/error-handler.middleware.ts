import type { VercelResponse } from '@vercel/node';
import { AppError } from '../utils/errors';

export function handleError(error: unknown, res: VercelResponse): void {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      error: error.message,
    });
    return;
  }

  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
}
