import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { db } from '../../../lib/db';
import {
  doordashEventToOrderStatus,
  getDeliveryEventLabel,
} from '../../../lib/orders/deliveryStatus';

export const config = {
  api: { bodyParser: true },
};

const VALID_EVENTS = [
  'DASHER_CONFIRMED',
  'DASHER_CONFIRMED_PICKUP_ARRIVAL',
  'DASHER_PICKED_UP',
  'DASHER_CONFIRMED_DROPOFF_ARRIVAL',
  'DASHER_DROPPED_OFF',
  'DELIVERY_CANCELLED',
] as const;

type DoorDashEvent = (typeof VALID_EVENTS)[number];

interface DoorDashWebhookPayload {
  external_delivery_id: string;
  delivery_id?: string;
  event_name: DoorDashEvent;
  dasher?: {
    id?: number;
    first_name?: string;
    last_name?: string;
    phone_number?: string;
    dasher_phone_number_for_customer?: string;
    location?: {
      lat?: number;
      lng?: number;
    };
  };
  order_status?: string;
  tracking_url?: string;
  pickup_address?: string;
  dropoff_address?: string;
  estimated_pickup_time?: string;
  estimated_delivery_time?: string;
  actual_pickup_time?: string;
  actual_delivery_time?: string;
  cancellation_reason?: string;
}

async function broadcastDeliveryUpdate(
  orderId: string,
  event: string,
  userId: string,
  payload: Record<string, unknown>
) {
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const channel = supabase.channel('order-updates', {
    config: { broadcast: { ack: true } },
  });

  try {
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        supabase.removeChannel(channel);
        reject(new Error('Broadcast subscription timed out'));
      }, 5000);

      channel.subscribe(async (subStatus) => {
        if (subStatus === 'SUBSCRIBED') {
          try {
            await channel.send({
              type: 'broadcast',
              event: 'order-status-changed',
              payload: {
                orderId,
                userId,
                source: 'doordash_webhook',
                doordashEvent: event,
                ...payload,
              },
            });
            clearTimeout(timeout);
            resolve();
          } catch (sendErr) {
            clearTimeout(timeout);
            reject(sendErr);
          }
        }
      });
    });
  } finally {
    supabase.removeChannel(channel);
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const body = req.body as DoorDashWebhookPayload;

    const { event_name, external_delivery_id, delivery_id } = body;

    if (!event_name || !VALID_EVENTS.includes(event_name)) {
      console.warn('DoorDash webhook: unknown event_name', event_name);
      return res.status(200).json({ received: true });
    }

    const doordashDeliveryId = delivery_id || external_delivery_id;
    if (!doordashDeliveryId) {
      console.warn('DoorDash webhook: no delivery id in payload');
      return res.status(400).json({ message: 'Missing delivery identifier' });
    }

    let order = await db.findOrderByDoordashDeliveryId(doordashDeliveryId);

    if (!order && external_delivery_id && external_delivery_id !== doordashDeliveryId) {
      order = await db.findOrderByDoordashDeliveryId(external_delivery_id);
    }

    if (!order) {
      console.warn('DoorDash webhook: order not found for delivery', doordashDeliveryId);
      return res.status(200).json({ received: true, matched: false });
    }

    const updates: Record<string, unknown> = {
      deliveryLastEvent: event_name,
      doordashDeliveryStatus: event_name,
    };

    if (body.dasher) {
      const nameParts = [body.dasher.first_name, body.dasher.last_name].filter(Boolean);
      if (nameParts.length > 0) {
        updates.dasherName = nameParts.join(' ');
      }
      const dasherPhone =
        body.dasher.dasher_phone_number_for_customer || body.dasher.phone_number;
      if (dasherPhone) {
        updates.dasherPhone = dasherPhone;
      }
      if (body.dasher.location?.lat != null && body.dasher.location?.lng != null) {
        updates.dasherLatitude = body.dasher.location.lat;
        updates.dasherLongitude = body.dasher.location.lng;
      }
    }

    if (body.tracking_url) {
      updates.doordashTrackingUrl = body.tracking_url;
    }

    if (body.estimated_pickup_time) {
      updates.estimatedPickupTime = new Date(body.estimated_pickup_time);
    }
    if (body.estimated_delivery_time) {
      updates.estimatedDropoffTime = new Date(body.estimated_delivery_time);
    }

    if (event_name === 'DASHER_PICKED_UP') {
      updates.actualPickupTime = body.actual_pickup_time
        ? new Date(body.actual_pickup_time)
        : new Date();
    }

    if (event_name === 'DASHER_DROPPED_OFF') {
      updates.actualDropoffTime = body.actual_delivery_time
        ? new Date(body.actual_delivery_time)
        : new Date();
    }

    const newOrderStatus = doordashEventToOrderStatus(event_name);
    if (newOrderStatus) {
      updates.status = newOrderStatus;
    }

    const updatedOrder = await db.updateOrder(order.id, updates as any);

    try {
      await broadcastDeliveryUpdate(order.id, event_name, order.userId, {
        status: updatedOrder.status,
        doordashEvent: event_name,
        dasherName: updates.dasherName,
        dasherLatitude: updates.dasherLatitude,
        dasherLongitude: updates.dasherLongitude,
        estimatedDropoffTime: updates.estimatedDropoffTime,
        trackingUrl: updates.doordashTrackingUrl,
        notificationMessage: getDeliveryEventLabel(event_name),
      });
    } catch (broadcastErr) {
      console.error('Failed to broadcast delivery update:', broadcastErr);
    }

    console.log(`DoorDash webhook processed: ${event_name} for order ${order.id}`);

    return res.status(200).json({ received: true, matched: true });
  } catch (error: any) {
    console.error('DoorDash webhook error:', error);
    return res.status(200).json({ received: true, error: error.message });
  }
}
