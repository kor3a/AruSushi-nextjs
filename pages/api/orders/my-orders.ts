import type { NextApiRequest, NextApiResponse } from 'next';
import { createApiClient } from '../../../lib/supabase/server';
import { db } from '../../../lib/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Check if user is authenticated with Supabase
    const supabase = createApiClient(req, res);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Get user's orders (already sorted by createdAt desc in the db layer)
    const orders = await db.findOrdersByUserId(user.id);

    return res.status(200).json({ orders });
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
}
