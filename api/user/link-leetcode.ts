import { createHandler } from '../../src/utils/api-handler';
import { authMiddleware } from '../../src/middleware/auth.middleware';
import { userService } from '../../src/services/user.service';
import { validate, linkLeetCodeSchema } from '../../src/utils/validators';

export default createHandler({
  method: 'POST',
  middleware: [authMiddleware],
  handler: async (req, res) => {
    const { username } = validate(linkLeetCodeSchema, req.body);
    const user = await userService.linkLeetCode(req.user!.sub, username);

    res.status(200).json({
      success: true,
      data: { user },
    });
  },
});
