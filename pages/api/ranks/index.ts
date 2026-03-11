import type { NextApiRequest, NextApiResponse } from 'next';
import { createApiClient } from '../../../lib/supabase/server';
import { db, isRanksSchemaMissingError, isRewardsSchemaMissingError } from '../../../lib/db';
import { getNextRank, getRankTier, RANK_TIERS } from '../../../lib/ranks/config';
import type { UserRankInfo } from '../../../lib/ranks/types';

function buildRankInfo(
  rankRecord: Awaited<ReturnType<typeof db.getUserRank>>
): UserRankInfo {
  const tier = getRankTier(rankRecord.rank);
  const next = getNextRank(rankRecord.rank);

  return {
    rank: rankRecord.rank,
    label: tier.label,
    rankStartedAt: rankRecord.rankStartedAt.toISOString(),
    rankExpiresAt: rankRecord.rankExpiresAt.toISOString(),
    discountPercent: tier.discountPercent,
    freeAppetizerClaimed: rankRecord.freeAppetizerClaimed,
    freeRollClaimed: rankRecord.freeRollClaimed,
    lastMonthlyAppetizerAt: rankRecord.lastMonthlyAppetizerAt?.toISOString() ?? null,
    nextUpgrade: next
      ? {
          rank: next,
          label: RANK_TIERS[next].label,
          cost: RANK_TIERS[next].upgradeCost!,
        }
      : null,
  };
}

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

    const existingUser = await db.findUserById(user.id);
    if (!existingUser) {
      await db.createUser({
        id: user.id,
        email: user.email!,
        name: user.user_metadata?.name || null,
      });
    }

    if (req.method === 'GET') {
      try {
        const rankRecord = await db.getUserRank(user.id);
        return res.status(200).json(buildRankInfo(rankRecord));
      } catch (error) {
        if (isRanksSchemaMissingError(error)) {
          return res.status(200).json({
            rank: 'silver',
            label: 'Silver',
            rankStartedAt: new Date().toISOString(),
            rankExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            discountPercent: 0,
            freeAppetizerClaimed: false,
            freeRollClaimed: false,
            lastMonthlyAppetizerAt: null,
            nextUpgrade: {
              rank: 'rose_gold',
              label: 'Rose Gold',
              cost: 500,
            },
          } satisfies UserRankInfo);
        }
        throw error;
      }
    }

    // POST: upgrade rank
    try {
      const { rankRecord, pointsSummary } = await db.upgradeRank(user.id);
      return res.status(200).json({
        message: `Congratulations! You are now a ${getRankTier(rankRecord.rank).label} member!`,
        rankInfo: buildRankInfo(rankRecord),
        pointsBalance: pointsSummary.pointsBalance,
      });
    } catch (error: any) {
      if (error?.message === 'ALREADY_MAX_RANK') {
        return res.status(400).json({ message: 'You are already at the highest rank!' });
      }
      if (error?.message === 'INSUFFICIENT_POINTS') {
        return res.status(400).json({ message: 'Not enough sushi points to upgrade' });
      }
      if (isRanksSchemaMissingError(error)) {
        return res.status(503).json({
          message: 'Member ranks database table is not set up yet. Run the add_member_ranks.sql migration.',
        });
      }
      if (isRewardsSchemaMissingError(error)) {
        return res.status(503).json({
          message: 'Rewards database tables are not set up yet.',
        });
      }
      throw error;
    }
  } catch (error: any) {
    console.error('Ranks API error:', error);
    return res.status(500).json({ message: error?.message || 'Internal server error' });
  }
}
