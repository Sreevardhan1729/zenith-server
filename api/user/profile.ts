import { createHandler } from '../../src/utils/api-handler';
import { authMiddleware } from '../../src/middleware/auth.middleware';
import { userService } from '../../src/services/user.service';

export default createHandler({
  method: 'GET',
  middleware: [authMiddleware],
  handler: async (req, res) => {
    const user = await userService.getProfile(req.user!.sub);

    res.status(200).json({
      success: true,
      data: { user },
    });
  },
});
