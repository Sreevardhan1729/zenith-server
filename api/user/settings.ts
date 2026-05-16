import { createHandler } from '../../src/utils/api-handler';
import { authMiddleware } from '../../src/middleware/auth.middleware';
import { userService } from '../../src/services/user.service';
import { validate, updateSettingsSchema } from '../../src/utils/validators';

export default createHandler({
  method: ['GET', 'PUT'],
  middleware: [authMiddleware],
  handler: async (req, res) => {
    if (req.method === 'GET') {
      const user = await userService.getProfile(req.user!.sub);
      res.status(200).json({
        success: true,
        data: { settings: user.settings },
      });
      return;
    }

    const settings = validate(updateSettingsSchema, req.body);
    const user = await userService.updateSettings(req.user!.sub, settings);

    res.status(200).json({
      success: true,
      data: { user },
    });
  },
});
