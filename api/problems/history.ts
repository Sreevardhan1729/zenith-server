import { createHandler } from '../../src/utils/api-handler';
import { authMiddleware } from '../../src/middleware/auth.middleware';
import { assignmentService } from '../../src/services/assignment.service';

export default createHandler({
  method: 'GET',
  middleware: [authMiddleware],
  handler: async (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 30;

    const { assignments, total } = await assignmentService.getHistory(req.user!.sub, page, limit);

    res.status(200).json({
      success: true,
      data: {
        assignments,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    });
  },
});
