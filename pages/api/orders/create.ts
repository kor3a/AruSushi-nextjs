import type { NextApiRequest, NextApiResponse } from 'next';
import { createApiClient } from '../../../lib/supabase/server';
import { db } from '../../../lib/db';
import {
  sendOrderNotificationToRestaurant,
  sendOrderConfirmationToCustomer,
} from '../../../lib/email/sendOrderNotification';
import { doordashClient } from '../../../lib/doordash/client';
import { restaurantInfo } from '../../../data/restaurantInfo';

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
      orderType = 'pickup',
      paymentIntentId,
      paymentStatus,
      deliveryAddress,
      deliveryPhone,
      deliveryQuoteId, // DoorDash quote ID to accept
      deliveryFee, // Delivery fee from quote
      notes,
    } = req.body;

    // Validation
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No items in order' });
    }

    if (!total || total <= 0) {
      return res.status(400).json({ message: 'Invalid total amount' });
    }

    // Validate delivery address if delivery is selected
    if (orderType === 'delivery' && !deliveryAddress) {
      return res.status(400).json({ message: 'Delivery address is required for delivery orders' });
    }

    if (orderType === 'delivery' && !deliveryPhone) {
      return res.status(400).json({ message: 'Phone number is required for delivery orders' });
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

    // Initialize DoorDash delivery variables
    let doordashDeliveryId: string | undefined;
    let doordashDeliveryStatus: string | undefined;
    let doordashTrackingUrl: string | undefined;

    // Accept DoorDash delivery quote if order type is delivery
    if (orderType === 'delivery' && doordashClient.isConfigured()) {
      if (!deliveryQuoteId) {
        return res.status(400).json({ message: 'Delivery quote is required for delivery orders' });
      }

      try {
        // Accept the delivery quote - this dispatches a Dasher
        const doordashResponse = await doordashClient.acceptDeliveryQuote(deliveryQuoteId);
        doordashDeliveryId = doordashResponse.id;
        doordashDeliveryStatus = doordashResponse.status;
        doordashTrackingUrl = doordashResponse.tracking_url;
        
        console.log('DoorDash delivery accepted:', {
          deliveryId: doordashDeliveryId,
          status: doordashDeliveryStatus,
          trackingUrl: doordashTrackingUrl,
        });
      } catch (error: any) {
        console.error('Failed to accept DoorDash delivery quote:', error);
        // In production, you might want to fail the order if delivery is critical
        // For now, we'll continue and let the restaurant handle it manually
        return res.status(500).json({ 
          message: 'Failed to confirm delivery. Please try again or select pickup.',
          error: error.message 
        });
      }
    }

    // Create order
    const order = await db.createOrder({
      userId: user.id,
      items: orderItems,
      total,
      orderType,
      status: 'pending',
      paymentIntentId,
      paymentStatus: paymentStatus || 'pending',
      deliveryAddress: orderType === 'delivery' ? deliveryAddress : undefined,
      deliveryPhone,
      deliveryFee: orderType === 'delivery' ? deliveryFee : undefined,
      doordashDeliveryId,
      doordashDeliveryStatus,
      doordashTrackingUrl,
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
