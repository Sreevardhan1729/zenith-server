import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHandler } from '../../src/utils/api-handler';
import { authService } from '../../src/services/auth.service';
import { validate, registerSchema } from '../../src/utils/validators';

export default createHandler({
  method: 'POST',
  handler: async (req, res) => {
    const { email, password } = validate(registerSchema, req.body);
    const { user, tokens } = await authService.register(email, password);

    res.status(201).json({
      success: true,
      data: {
        user: authService.sanitizeUser(user),
        ...tokens,
      },
    });
  },
});
