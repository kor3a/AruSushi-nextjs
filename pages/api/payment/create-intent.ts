import type { NextApiRequest, NextApiResponse } from 'next';
import { createApiClient } from '../../../lib/supabase/server';
import Stripe from 'stripe';
import { db, isRewardsSchemaMissingError, isRanksSchemaMissingError } from '../../../lib/db';
import { getMenuPriceOverrides } from '../../../lib/menu/priceOverrides';
import {
  validateSubmittedItems,
  trustedSubtotal,
  describePriceErrors,
  SubmittedItem,
} from '../../../lib/menu/pricing';
import { calculateRewardDiscount } from '../../../lib/rewards/eligibility';
import { getDiscountPercent } from '../../../lib/ranks/config';

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

    const normalizedItems: SubmittedItem[] = items.map((item: any) => ({
      name: String(item?.name || '').trim(),
      price: Number(item?.price),
      quantity: Number(item?.quantity || 1),
      options: item?.options,
    }));

    const hasInvalidItem = normalizedItems.some(
      (item) =>
        !item.name ||
        Number.isNaN(item.price) ||
        item.price < 0 ||
        Number.isNaN(item.quantity) ||
        item.quantity <= 0
    );
    if (hasInvalidItem) {
      return res.status(400).json({ message: 'Order contains invalid item data' });
    }

    // Re-price the cart from the menu. The client is never trusted for prices.
    const overrides = await getMenuPriceOverrides();
    const priceErrors = validateSubmittedItems(normalizedItems, overrides);
    if (priceErrors.length > 0) {
      console.warn('Rejected payment intent with forged cart prices:', {
        userId: user.id,
        errors: priceErrors,
      });
      return res.status(400).json({
        message: `Cart prices do not match the menu: ${describePriceErrors(priceErrors)}`,
      });
    }

    const subtotal = trustedSubtotal(normalizedItems, overrides);

    // Recompute the reward discount from the stored redemption, not the body.
    let serverRewardDiscount = 0;
    if (rewardRedemptionId) {
      try {
        const redemption = await db.getRewardRedemptionById(
          user.id,
          String(rewardRedemptionId)
        );
        if (!redemption || redemption.status !== 'available') {
          return res.status(400).json({ message: 'Selected reward is no longer available' });
        }
        serverRewardDiscount = calculateRewardDiscount(redemption.rewardType, normalizedItems);
      } catch (error) {
        if (!isRewardsSchemaMissingError(error)) {
          throw error;
        }
      }
    }

    // Recompute the rank discount from the user's actual rank.
    let serverRankDiscount = 0;
    try {
      const userRank = await db.getUserRank(user.id);
      const discountPercent = getDiscountPercent(userRank.rank);
      if (discountPercent > 0) {
        serverRankDiscount = Number((subtotal * (discountPercent / 100)).toFixed(2));
      }
    } catch (error) {
      if (!isRanksSchemaMissingError(error)) {
        throw error;
      }
    }

    // Mirrors the client's amountToCharge in pages/checkout.tsx, including the
    // $0.50 Stripe minimum. Note the delivery fee is intentionally not part of
    // this figure, matching existing checkout behaviour.
    const expectedAmount = Math.max(
      Number((subtotal - serverRewardDiscount - serverRankDiscount).toFixed(2)),
      0.5
    );

    if (Math.abs(expectedAmount - Number(amount)) > 0.01) {
      console.warn('Rejected payment intent with mismatched amount:', {
        userId: user.id,
        requestedAmount: Number(amount),
        expectedAmount,
      });
      return res.status(400).json({
        message: 'Payment amount does not match the calculated order total',
        expectedAmount,
      });
    }

    const itemsSummary = items
      .map((item: any) => `${String(item?.name || 'Item')} x${Number(item?.quantity || 1)}`)
      .join(', ');

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(expectedAmount * 100), // Convert to cents (server-computed)
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
