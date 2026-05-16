import { createHandler } from '../../src/utils/api-handler';
import { authMiddleware } from '../../src/middleware/auth.middleware';
import { userService } from '../../src/services/user.service';
import { validate, updateReminderSettingsSchema } from '../../src/utils/validators';

export default createHandler({
  method: ['GET', 'PUT'],
  middleware: [authMiddleware],
  handler: async (req, res) => {
    if (req.method === 'GET') {
      const user = await userService.getProfile(req.user!.sub);
      res.status(200).json({
        success: true,
        data: {
          template: user.reminderTemplate,
          customTimes: user.customReminderTimes,
        },
      });
      return;
    }

    const { template, customTimes } = validate(updateReminderSettingsSchema, req.body);
    const user = await userService.updateReminderSettings(req.user!.sub, template, customTimes);

    res.status(200).json({
      success: true,
      data: {
        template: user.reminderTemplate,
        customTimes: user.customReminderTimes,
      },
    });
  },
});
