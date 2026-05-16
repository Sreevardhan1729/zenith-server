import type { VercelResponse } from '@vercel/node';
import type { AuthenticatedRequest, ApiHandler } from '../types/api.types';
import { AppError } from './errors';
import { connectDB } from '../config/database';

type Middleware = (
  req: AuthenticatedRequest,
  res: VercelResponse
) => Promise<boolean>;

interface HandlerOptions {
  method: string | string[];
  middleware?: Middleware[];
  handler: ApiHandler;
}

export function createHandler(options: HandlerOptions) {
  const methods = Array.isArray(options.method)
    ? options.method.map((m) => m.toUpperCase())
    : [options.method.toUpperCase()];

  return async (req: AuthenticatedRequest, res: VercelResponse) => {
    if (!methods.includes(req.method?.toUpperCase() || '')) {
      res.setHeader('Allow', methods.join(', '));
      return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
      await connectDB();

      if (options.middleware) {
        for (const mw of options.middleware) {
          const shouldContinue = await mw(req, res);
          if (!shouldContinue) return;
        }
      }

      await options.handler(req, res);
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message,
        });
      }

      console.error('Unhandled error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  };
}
