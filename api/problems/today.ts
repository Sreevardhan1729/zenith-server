import { createHandler } from '../../src/utils/api-handler';
import { authMiddleware } from '../../src/middleware/auth.middleware';
import { assignmentService } from '../../src/services/assignment.service';

export default createHandler({
  method: 'GET',
  middleware: [authMiddleware],
  handler: async (req, res) => {
    const assignments = await assignmentService.getToday(req.user!.sub);

    res.status(200).json({
      success: true,
      data: { assignments },
    });
  },
});
