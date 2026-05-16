import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHandler } from '../../src/utils/api-handler';
import { authService } from '../../src/services/auth.service';
import { ValidationError } from '../../src/utils/errors';

export default createHandler({
  method: 'POST',
  handler: async (req, res) => {
    const { refreshToken } = req.body || {};

    if (!refreshToken) {
      throw new ValidationError('Refresh token is required');
    }

    const tokens = await authService.refreshToken(refreshToken);

    res.status(200).json({
      success: true,
      data: tokens,
    });
  },
});
