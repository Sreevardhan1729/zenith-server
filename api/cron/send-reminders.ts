import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB } from '../../src/config/database';
import { config } from '../../src/config';
import { reminderService } from '../../src/services/reminder.service';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${config.cron.secret}`) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  try {
    await connectDB();
    const result = await reminderService.processReminders();

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Cron send-reminders error:', error);
    res.status(500).json({ success: false, error: 'Internal error' });
  }
}
