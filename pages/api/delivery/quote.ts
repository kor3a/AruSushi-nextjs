import type { NextApiRequest, NextApiResponse } from 'next';
import { createApiClient } from '../../../lib/supabase/server';
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

    // Check if DoorDash is configured
    if (!doordashClient.isConfigured()) {
      return res.status(503).json({ 
        message: 'Delivery service is not available at this time',
        available: false
      });
    }

    const {
      deliveryAddress,
      deliveryPhone,
      orderTotal,
      items,
    } = req.body;

    // Validation
    if (!deliveryAddress) {
      return res.status(400).json({ message: 'Delivery address is required' });
    }

    if (!deliveryPhone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    if (!orderTotal || orderTotal <= 0) {
      return res.status(400).json({ message: 'Invalid order total' });
    }

    // Format restaurant address
    const restaurantAddress = `${restaurantInfo.address.street}, ${restaurantInfo.address.city}, ${restaurantInfo.address.state} ${restaurantInfo.address.zip}`;
    
    // Format restaurant phone (remove formatting)
    const restaurantPhone = restaurantInfo.phone.replace(/\D/g, '');

    // Create quote request
    const quoteRequest = {
      external_delivery_id: `quote-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      pickup_address: restaurantAddress,
      pickup_phone_number: restaurantPhone,
      pickup_business_name: restaurantInfo.name,
      dropoff_address: deliveryAddress,
      dropoff_phone_number: deliveryPhone.replace(/\D/g, ''),
      order_value: Math.round(orderTotal * 100), // Convert to cents
      items: items?.map((item: any) => ({
        name: item.name,
        quantity: item.quantity,
      })),
    };

    // Get delivery quote from DoorDash
    const quote = await doordashClient.getDeliveryQuote(quoteRequest);

    // Calculate estimated delivery time
    let estimatedDeliveryMinutes: number | null = null;
    if (quote.time_estimate_seconds) {
      estimatedDeliveryMinutes = Math.ceil(quote.time_estimate_seconds / 60);
    } else if (quote.delivery_time?.estimated_dropoff_time) {
      const dropoffTime = new Date(quote.delivery_time.estimated_dropoff_time);
      const now = new Date();
      estimatedDeliveryMinutes = Math.ceil((dropoffTime.getTime() - now.getTime()) / (1000 * 60));
    }

    return res.status(200).json({
      available: true,
      quote: {
        id: quote.external_delivery_id, // Use external_delivery_id as the identifier (used to accept the quote via /drive/v2/quotes/{id}/accept)
        externalDeliveryId: quote.external_delivery_id,
        fee: quote.fee / 100, // Convert from cents to dollars
        currency: quote.currency || 'USD',
        estimatedDeliveryMinutes,
        estimatedPickupTime: quote.delivery_time?.estimated_pickup_time,
        estimatedDropoffTime: quote.delivery_time?.estimated_dropoff_time,
        expiresAt: quote.expires_at,
      },
    });
  } catch (error: any) {
    console.error('Delivery quote error:', error);
    
    // Return a user-friendly error
    return res.status(500).json({ 
      message: error.message || 'Unable to get delivery quote. Please try again.',
      available: false
    });
  }
}
