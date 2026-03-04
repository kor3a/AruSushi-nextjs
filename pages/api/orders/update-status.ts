import type { NextApiRequest, NextApiResponse } from 'next';
import { createApiClient } from '../../../lib/supabase/server';
import { db } from '../../../lib/db';
import { canManageOrders } from '../../../lib/auth/roles';

const PICKUP_ALLOWED_STATUSES = ['confirmed', 'preparing', 'ready', 'picked_up', 'cancelled'];
const DELIVERY_ALLOWED_STATUSES = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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

    const { orderId, status } = req.body as { orderId?: string; status?: string };

    if (!orderId || !status) {
      return res.status(400).json({ message: 'orderId and status are required' });
    }

    const existingOrder = await db.findOrderById(orderId);
    if (!existingOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const allowedStatuses =
      existingOrder.orderType === 'pickup' ? PICKUP_ALLOWED_STATUSES : DELIVERY_ALLOWED_STATUSES;
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid status for ${existingOrder.orderType} order` });
    }

    const updatedOrder = await db.updateOrder(orderId, { status });
    return res.status(200).json({ order: updatedOrder });
  } catch (error: any) {
    console.error('Error updating order status:', error);
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
}

