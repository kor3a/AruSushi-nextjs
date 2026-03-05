import type { NextApiRequest, NextApiResponse } from 'next';
import { createApiClient } from '../../../lib/supabase/server';
import { canManageOrders } from '../../../lib/auth/roles';
import { db, isStoreSettingsMissingError } from '../../../lib/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const supabase = createApiClient(req, res);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!canManageOrders(user.email)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const { action, reason, resumeAt } = req.body;

    if (action === 'pause') {
      const parsedResumeAt = resumeAt ? new Date(resumeAt) : null;

      if (parsedResumeAt && isNaN(parsedResumeAt.getTime())) {
        return res.status(400).json({ message: 'Invalid resumeAt date' });
      }

      const settings = await db.pauseOrders({
        reason: reason || undefined,
        resumeAt: parsedResumeAt,
        pausedByEmail: user.email!,
      });

      return res.status(200).json({
        message: 'Orders paused',
        settings,
      });
    }

    if (action === 'resume') {
      const settings = await db.resumeOrders();

      return res.status(200).json({
        message: 'Orders resumed',
        settings,
      });
    }

    return res.status(400).json({ message: 'Invalid action. Use "pause" or "resume".' });
  } catch (error) {
    if (isStoreSettingsMissingError(error)) {
      return res.status(503).json({
        message:
          'Store settings table not set up. Please run the add_store_settings.sql migration.',
      });
    }

    console.error('Pause orders error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
