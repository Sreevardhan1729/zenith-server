import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHandler } from '../../src/utils/api-handler';
import { authService } from '../../src/services/auth.service';
import { validate, loginSchema } from '../../src/utils/validators';

export default createHandler({
  method: 'POST',
  handler: async (req, res) => {
    const { email, password } = validate(loginSchema, req.body);
    const { user, tokens } = await authService.login(email, password);

    res.status(200).json({
      success: true,
      data: {
        user: authService.sanitizeUser(user),
        ...tokens,
      },
    });
  },
});
