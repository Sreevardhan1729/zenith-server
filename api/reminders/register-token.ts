import { createHandler } from '../../src/utils/api-handler';
import { authMiddleware } from '../../src/middleware/auth.middleware';
import { DeviceToken } from '../../src/models/device-token.model';
import { validate, registerTokenSchema } from '../../src/utils/validators';

export default createHandler({
  method: ['POST', 'DELETE'],
  middleware: [authMiddleware],
  handler: async (req, res) => {
    if (req.method === 'POST') {
      const { token, platform } = validate(registerTokenSchema, req.body);

      await DeviceToken.findOneAndUpdate(
        { token },
        {
          userId: req.user!.sub,
          token,
          platform,
          isActive: true,
          lastUsedAt: new Date(),
        },
        { upsert: true, new: true }
      );

      res.status(200).json({
        success: true,
        message: 'Device token registered',
      });
      return;
    }

    const { token } = req.body || {};
    if (token) {
      await DeviceToken.findOneAndUpdate({ token }, { isActive: false });
    }

    res.status(200).json({
      success: true,
      message: 'Device token deactivated',
    });
  },
});
