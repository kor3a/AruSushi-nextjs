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

    // Create DoorDash delivery if order type is delivery
    if (orderType === 'delivery' && doordashClient.isConfigured()) {
      try {
        // Format restaurant address
        const restaurantAddress = `${restaurantInfo.address.street}, ${restaurantInfo.address.city}, ${restaurantInfo.address.state} ${restaurantInfo.address.zip}`;
        
        // Format restaurant phone (remove formatting)
        const restaurantPhone = restaurantInfo.phone.replace(/\D/g, '');

        // Create DoorDash delivery request
        const doordashRequest = {
          external_delivery_id: `order-${Date.now()}`, // Temporary ID, will be replaced with actual order ID
          pickup_address: restaurantAddress,
          pickup_phone_number: restaurantPhone,
          pickup_business_name: restaurantInfo.name,
          pickup_instructions: notes || undefined,
          dropoff_address: deliveryAddress,
          dropoff_phone_number: deliveryPhone.replace(/\D/g, ''),
          dropoff_instructions: notes || undefined,
          order_value: Math.round(total * 100), // Convert to cents
          items: items.map((item: any) => ({
            name: item.name,
            quantity: item.quantity,
          })),
        };

        const doordashResponse = await doordashClient.createDelivery(doordashRequest);
        doordashDeliveryId = doordashResponse.id;
        doordashDeliveryStatus = doordashResponse.status;
      } catch (error: any) {
        console.error('Failed to create DoorDash delivery:', error);
        // Don't fail the order creation if DoorDash fails
        // The order will be created without DoorDash integration
        // In production, you might want to handle this differently
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
      doordashDeliveryId,
      doordashDeliveryStatus,
      customerName: user.user_metadata?.name || dbUser.name || undefined,
      customerEmail: user.email,
      notes,
    });

    // Update DoorDash external_delivery_id with actual order ID if delivery was created
    if (orderType === 'delivery' && doordashDeliveryId && doordashClient.isConfigured()) {
      // Note: DoorDash API might not support updating external_delivery_id after creation
      // This is a limitation we'll need to work with
      // In production, you might want to generate the order ID first, then create DoorDash delivery
    }

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
