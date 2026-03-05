import type { NextApiRequest, NextApiResponse } from 'next';
import { db, isStoreSettingsMissingError } from '../../../lib/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { paused, settings } = await db.areOrdersPaused();

    return res.status(200).json({
      ordersPaused: paused,
      pauseReason: settings.pauseReason,
      resumeAt: settings.resumeAt,
    });
  } catch (error) {
    if (isStoreSettingsMissingError(error)) {
      return res.status(200).json({
        ordersPaused: false,
        pauseReason: null,
        resumeAt: null,
      });
    }

    console.error('Failed to fetch store settings:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
