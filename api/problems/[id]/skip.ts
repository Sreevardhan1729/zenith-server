import { createHandler } from '../../../src/utils/api-handler';
import { authMiddleware } from '../../../src/middleware/auth.middleware';
import { assignmentService } from '../../../src/services/assignment.service';

export default createHandler({
  method: 'POST',
  middleware: [authMiddleware],
  handler: async (req, res) => {
    const { id } = req.query;
    const assignment = await assignmentService.markSkipped(req.user!.sub, id as string);

    res.status(200).json({
      success: true,
      data: { assignment },
    });
  },
});
