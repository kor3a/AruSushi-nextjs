import type { NextApiRequest, NextApiResponse } from 'next';
import { createApiClient } from '../../../lib/supabase/server';
import { db, isRewardsSchemaMissingError } from '../../../lib/db';
import {
  sendOrderNotificationToRestaurant,
  sendOrderConfirmationToCustomer,
} from '../../../lib/email/sendOrderNotification';
import { sendOrderTicketsToPrintNode } from '../../../lib/printing/sendOrderTicketsToPrintNode';
import { doordashClient } from '../../../lib/doordash/client';
import { restaurantInfo } from '../../../data/restaurantInfo';
import { POINTS_PER_DOLLAR } from '../../../lib/rewards/catalog';
import { calculateRewardDiscount } from '../../../lib/rewards/eligibility';

interface NormalizedOrderItem {
  name: string;
  price: number;
  quantity: number;
  specialNotes?: string;
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
      rewardRedemptionId,
      rewardDiscount,
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

    const normalizedItems: NormalizedOrderItem[] = items.map((item: any) => ({
      name: String(item.name || '').trim(),
      price: Number(item.price),
      quantity: Number(item.quantity),
      specialNotes: item.specialNotes,
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

    const subtotal = Number(
      normalizedItems.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)
    );
    const normalizedDeliveryFee =
      orderType === 'delivery' ? Number(deliveryFee || 0) : 0;

    let appliedReward: Awaited<ReturnType<typeof db.getRewardRedemptionById>> = null;
    let appliedRewardDiscount = 0;

    if (rewardRedemptionId) {
      let rewardRedemption = null;
      try {
        rewardRedemption = await db.getRewardRedemptionById(
          user.id,
          String(rewardRedemptionId)
        );
      } catch (error) {
        if (isRewardsSchemaMissingError(error)) {
          return res.status(503).json({
            message:
              'Rewards tables are not set up yet. Please run add_user_points_rewards.sql migration.',
          });
        }
        throw error;
      }

      if (!rewardRedemption || rewardRedemption.status !== 'available') {
        return res.status(400).json({ message: 'Selected reward is no longer available' });
      }

      appliedRewardDiscount = calculateRewardDiscount(
        rewardRedemption.rewardType,
        normalizedItems
      );

      if (appliedRewardDiscount <= 0) {
        return res.status(400).json({
          message: `Add an eligible item to use ${rewardRedemption.rewardLabel}`,
        });
      }

      if (
        rewardDiscount !== undefined &&
        Math.abs(Number(rewardDiscount) - appliedRewardDiscount) > 0.01
      ) {
        return res.status(400).json({ message: 'Reward discount mismatch' });
      }

      appliedReward = rewardRedemption;
    }

    const expectedTotal = Number(
      (subtotal + normalizedDeliveryFee - appliedRewardDiscount).toFixed(2)
    );

    if (expectedTotal <= 0) {
      return res.status(400).json({ message: 'Invalid final order total' });
    }

    if (Math.abs(expectedTotal - Number(total)) > 0.01) {
      return res.status(400).json({
        message: 'Order total does not match calculated total',
        expectedTotal,
      });
    }

    // Create order items
    const orderItems = normalizedItems.map((item) => ({
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

    // Prepare order notes (include DoorDash error if any)
    let orderNotes = notes || '';
    if (doordashError) {
      orderNotes = `[DELIVERY ISSUE: ${doordashError}] ${orderNotes}`.trim();
    }
    if (appliedReward) {
      orderNotes = `[REWARD APPLIED: ${appliedReward.rewardLabel} -$${appliedRewardDiscount.toFixed(
        2
      )}] ${orderNotes}`.trim();
    }

    // Create order
    const order = await db.createOrder({
      userId: user.id,
      items: orderItems,
      total: expectedTotal,
      orderType,
      status: doordashError ? 'pending' : 'pending', // Could set to 'needs_attention' if you add that status
      paymentIntentId,
      paymentStatus: paymentStatus || 'pending',
      deliveryAddress: orderType === 'delivery' ? deliveryAddress : undefined,
      deliveryPhone,
      deliveryFee: orderType === 'delivery' ? normalizedDeliveryFee : undefined,
      doordashDeliveryId,
      doordashDeliveryStatus,
      doordashTrackingUrl,
      customerName: user.user_metadata?.name || dbUser.name || undefined,
      customerEmail: user.email,
      notes: orderNotes,
    });

    let pointsEarned = 0;
    let pointsBalance: number | undefined;

    if (appliedReward) {
      try {
        const usedReward = await db.markRewardRedemptionUsed(
          user.id,
          appliedReward.id,
          order.id
        );

        if (!usedReward) {
          console.warn('Reward could not be marked as used:', appliedReward.id);
        }
      } catch (error) {
        if (!isRewardsSchemaMissingError(error)) {
          throw error;
        }
        console.warn('Rewards schema missing; could not mark redemption as used.');
      }
    }

    if (paymentStatus === 'paid') {
      pointsEarned = Math.floor(expectedTotal * POINTS_PER_DOLLAR);
      try {
        const pointsSummary =
          pointsEarned > 0
            ? await db.addPointsToUser(user.id, pointsEarned)
            : await db.getUserPointsSummary(user.id);
        pointsBalance = pointsSummary.pointsBalance;
      } catch (error) {
        if (!isRewardsSchemaMissingError(error)) {
          throw error;
        }
        console.warn('Rewards schema missing; skipping points update for order.');
        pointsEarned = 0;
      }
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
      sendOrderTicketsToPrintNode(order).catch((error) =>
        console.error('Failed to print station tickets via PrintNode:', error)
      );
    }

    // Return response with delivery status info
    const responseMessage = doordashError 
      ? 'Order created. Note: There was an issue with delivery scheduling. The restaurant will contact you about delivery arrangements.'
      : 'Order created successfully';

    return res.status(201).json({
      message: responseMessage,
      order,
      pointsEarned,
      pointsBalance,
      appliedReward: appliedReward
        ? {
            id: appliedReward.id,
            rewardType: appliedReward.rewardType,
            rewardLabel: appliedReward.rewardLabel,
            discount: appliedRewardDiscount,
          }
        : null,
      deliveryStatus: doordashError ? 'manual' : 'scheduled',
      deliveryError: doordashError,
    });
  } catch (error: any) {
    console.error('Order creation error:', error);
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
}
