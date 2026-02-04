import type { NextApiRequest, NextApiResponse } from 'next';
import { createApiClient } from '../../../lib/supabase/server';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const supabase = createApiClient(req, res);
    await supabase.auth.signOut();

    return res.status(200).json({ message: 'Signed out successfully' });
  } catch (error) {
    console.error('Signout error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
