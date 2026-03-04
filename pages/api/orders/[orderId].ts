import type { NextApiRequest, NextApiResponse } from 'next';
import { createApiClient } from '../../../lib/supabase/server';
import { db } from '../../../lib/db';
import { canManageOrders } from '../../../lib/auth/roles';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
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

    const orderIdParam = req.query.orderId;
    const orderId = Array.isArray(orderIdParam) ? orderIdParam[0] : orderIdParam;

    if (!orderId) {
      return res.status(400).json({ message: 'Order ID is required' });
    }

    const order = await db.findOrderById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.userId !== user.id && !canManageOrders(user.email)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    return res.status(200).json({ order });
  } catch (error: any) {
    console.error('Error fetching order by ID:', error);
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
}

