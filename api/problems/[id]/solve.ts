import { createHandler } from '../../../src/utils/api-handler';
import { authMiddleware } from '../../../src/middleware/auth.middleware';
import { assignmentService } from '../../../src/services/assignment.service';
import { streakService } from '../../../src/services/streak.service';

export default createHandler({
  method: 'POST',
  middleware: [authMiddleware],
  handler: async (req, res) => {
    const { id } = req.query;
    const assignment = await assignmentService.markSolved(req.user!.sub, id as string);
    await streakService.updateStreak(req.user!.sub);

    res.status(200).json({
      success: true,
      data: { assignment },
    });
  },
});
