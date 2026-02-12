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
    let doordashError: string | undefined;
    
    if (orderType === 'delivery' && doordashClient.isConfigured()) {
      if (!deliveryQuoteId) {
        // No quote ID provided - order will be created without DoorDash
        console.warn('No delivery quote ID provided for delivery order');
        doordashError = 'No delivery quote provided';
        doordashDeliveryStatus = 'failed';
      } else {
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
          // Don't fail the order - payment was already processed
          // Create the order anyway and flag it for manual handling
          doordashError = error.message || 'DoorDash delivery creation failed';
          doordashDeliveryStatus = 'failed';
        }
      }
    }

    // Keep user notes clean - don't mix in internal delivery system errors
    // DoorDash delivery issues are tracked via doordashDeliveryStatus field
    const orderNotes = notes || '';

    // Create order
    const order = await db.createOrder({
      userId: user.id,
      items: orderItems,
      total,
      orderType,
      status: doordashError ? 'pending' : 'pending', // Could set to 'needs_attention' if you add that status
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
      notes: orderNotes,
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

    // Return response with delivery status info
    const responseMessage = doordashError 
      ? 'Order created. Note: There was an issue with delivery scheduling. The restaurant will contact you about delivery arrangements.'
      : 'Order created successfully';

    return res.status(201).json({
      message: responseMessage,
      order,
      deliveryStatus: doordashError ? 'manual' : 'scheduled',
      deliveryError: doordashError,
    });
  } catch (error: any) {
    console.error('Order creation error:', error);
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
}
