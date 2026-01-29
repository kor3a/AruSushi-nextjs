import type { NextApiRequest, NextApiResponse } from 'next';
import { createApiClient } from '../../../lib/supabase/server';
import { db } from '../../../lib/db';
import {
  sendOrderNotificationToRestaurant,
  sendOrderConfirmationToCustomer,
} from '../../../lib/email/sendOrderNotification';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Check if user is authenticated with Supabase
    const supabase = createApiClient(req, res);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const {
      items,
      total,
      paymentIntentId,
      paymentStatus,
      deliveryAddress,
      deliveryPhone,
      notes,
    } = req.body;

    // Validation
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No items in order' });
    }

    if (!total || total <= 0) {
      return res.status(400).json({ message: 'Invalid total amount' });
    }

    // Ensure user profile exists in our database
    let dbUser = await db.findUserById(user.id);
    if (!dbUser) {
      dbUser = await db.createUser({
        id: user.id,
        email: user.email!,
        name: user.user_metadata?.name || null,
      });
    }

    // Create order items
    const orderItems = items.map((item: any) => ({
      id: item.id,
      itemName: item.name,
      itemPrice: item.price,
      quantity: item.quantity,
      specialNotes: item.specialNotes || undefined,
    }));

    // Create order
    const order = await db.createOrder({
      userId: user.id,
      items: orderItems,
      total,
      status: 'pending',
      paymentIntentId,
      paymentStatus: paymentStatus || 'pending',
      deliveryAddress,
      deliveryPhone,
      customerName: user.user_metadata?.name || dbUser.name || undefined,
      customerEmail: user.email,
      notes,
    });

    // Send email notifications (don't wait for them to complete)
    // Only send if payment is successful
    if (paymentStatus === 'paid') {
      sendOrderNotificationToRestaurant(order).catch((error) =>
        console.error('Failed to send restaurant notification:', error)
      );
      sendOrderConfirmationToCustomer(order).catch((error) =>
        console.error('Failed to send customer confirmation:', error)
      );
    }

    return res.status(201).json({
      message: 'Order created successfully',
      order,
    });
  } catch (error: any) {
    console.error('Order creation error:', error);
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
}
