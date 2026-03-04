import type { NextApiRequest, NextApiResponse } from 'next';
import { createApiClient } from '../../../lib/supabase/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-11-17.clover',
});

const STRIPE_METADATA_LIMIT = 500;

function toMetadataValue(value: unknown): string {
  const text = String(value ?? '');
  if (text.length <= STRIPE_METADATA_LIMIT) {
    return text;
  }
  return `${text.slice(0, STRIPE_METADATA_LIMIT - 3)}...`;
}

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

    const { amount, items, deliveryAddress, deliveryPhone, notes, rewardRedemptionId, rewardType, rewardDiscount } = req.body;

    // Validation
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No items in order' });
    }

    const itemsSummary = items
      .map((item: any) => `${String(item?.name || 'Item')} x${Number(item?.quantity || 1)}`)
      .join(', ');

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        userId: user.id,
        userEmail: toMetadataValue(user.email || ''),
        userName: toMetadataValue(user.user_metadata?.name || ''),
        deliveryAddress: toMetadataValue(deliveryAddress || ''),
        deliveryPhone: toMetadataValue(deliveryPhone || ''),
        notes: toMetadataValue(notes || ''),
        itemCount: toMetadataValue(items.length),
        items: toMetadataValue(itemsSummary),
        rewardRedemptionId: toMetadataValue(rewardRedemptionId || ''),
        rewardType: toMetadataValue(rewardType || ''),
        rewardDiscount: toMetadataValue(rewardDiscount ? String(rewardDiscount) : ''),
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error: any) {
    console.error('Payment intent creation error:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
}
