import type { NextApiRequest, NextApiResponse } from 'next';
import { createApiClient } from '../../../lib/supabase/server';
import { db, isRewardsSchemaMissingError } from '../../../lib/db';
import { POINTS_PER_DOLLAR, REWARD_CATALOG, getRewardByType, isRewardType } from '../../../lib/rewards/catalog';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
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

    // Keep application user data in sync with auth users.
    const existingUser = await db.findUserById(user.id);
    if (!existingUser) {
      await db.createUser({
        id: user.id,
        email: user.email!,
        name: user.user_metadata?.name || null,
      });
    }

    if (req.method === 'GET') {
      let pointsSummary;
      let availableRedemptions;
      try {
        [pointsSummary, availableRedemptions] = await Promise.all([
          db.getUserPointsSummary(user.id),
          db.getAvailableRewardRedemptions(user.id),
        ]);
      } catch (error) {
        if (!isRewardsSchemaMissingError(error)) {
          throw error;
        }

        return res.status(200).json({
          pointsBalance: 0,
          lifetimePointsEarned: 0,
          lifetimePointsRedeemed: 0,
          pointsPerDollar: POINTS_PER_DOLLAR,
          rewardsCatalog: REWARD_CATALOG,
          availableRedemptions: [],
          rewardsEnabled: false,
        });
      }

      return res.status(200).json({
        pointsBalance: pointsSummary.pointsBalance,
        lifetimePointsEarned: pointsSummary.lifetimePointsEarned,
        lifetimePointsRedeemed: pointsSummary.lifetimePointsRedeemed,
        pointsPerDollar: POINTS_PER_DOLLAR,
        rewardsCatalog: REWARD_CATALOG,
        availableRedemptions: availableRedemptions.map((reward) => ({
          ...reward,
          claimedAt: reward.claimedAt.toISOString(),
          usedAt: reward.usedAt?.toISOString() ?? null,
        })),
      });
    }

    const { rewardType } = req.body as { rewardType?: string };
    if (!rewardType || !isRewardType(rewardType)) {
      return res.status(400).json({ message: 'Invalid reward type' });
    }

    const reward = getRewardByType(rewardType);
    if (!reward) {
      return res.status(400).json({ message: 'Reward not found' });
    }

    try {
      const { pointsSummary, redemption } = await db.claimReward(
        user.id,
        reward.type,
        reward.label,
        reward.pointsCost
      );

      const availableRedemptions = await db.getAvailableRewardRedemptions(user.id);

      return res.status(201).json({
        message: `${reward.label} claimed successfully`,
        pointsBalance: pointsSummary.pointsBalance,
        lifetimePointsEarned: pointsSummary.lifetimePointsEarned,
        lifetimePointsRedeemed: pointsSummary.lifetimePointsRedeemed,
        pointsPerDollar: POINTS_PER_DOLLAR,
        rewardsCatalog: REWARD_CATALOG,
        redeemedReward: {
          ...redemption,
          claimedAt: redemption.claimedAt.toISOString(),
          usedAt: redemption.usedAt?.toISOString() ?? null,
        },
        availableRedemptions: availableRedemptions.map((availableReward) => ({
          ...availableReward,
          claimedAt: availableReward.claimedAt.toISOString(),
          usedAt: availableReward.usedAt?.toISOString() ?? null,
        })),
      });
    } catch (error: any) {
      if (error?.message === 'INSUFFICIENT_POINTS') {
        return res.status(400).json({ message: 'Not enough points to claim this reward' });
      }
      if (isRewardsSchemaMissingError(error)) {
        return res.status(503).json({
          message:
            'Rewards database tables are not set up yet. Run the add_user_points_rewards.sql migration.',
        });
      }
      throw error;
    }
  } catch (error: any) {
    console.error('Rewards API error:', error);
    return res.status(500).json({ message: error?.message || 'Internal server error' });
  }
}
