import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHandler } from '../../src/utils/api-handler';
import { authService } from '../../src/services/auth.service';
import { authMiddleware } from '../../src/middleware/auth.middleware';
import { NotFoundError } from '../../src/utils/errors';

export default createHandler({
  method: 'GET',
  middleware: [authMiddleware],
  handler: async (req, res) => {
    const user = await authService.getUserById(req.user!.sub);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    res.status(200).json({
      success: true,
      data: { user },
    });
  },
});
