import type { NextApiRequest, NextApiResponse } from 'next';
import { createApiClient } from '../../../lib/supabase/server';
import {
  db,
  isPerksSchemaMissingError,
  isRanksSchemaMissingError,
  isRewardsSchemaMissingError,
} from '../../../lib/db';
import { getNextRank, getRankTier, RANK_TIERS } from '../../../lib/ranks/config';
import type { MemberRank, UserRankInfo } from '../../../lib/ranks/types';
import type { PerkStatus } from '../../../lib/perks/types';

async function loadPerks(userId: string, rank: MemberRank, birthday: Date | null): Promise<PerkStatus[]> {
  try {
    return await db.getMemberPerks(userId, rank, birthday);
  } catch (error) {
    if (isPerksSchemaMissingError(error)) {
      // Without the table we can't tell what's been used, so offer nothing.
      return [];
    }
    throw error;
  }
}

function buildRankInfo(
  rankRecord: Awaited<ReturnType<typeof db.getUserRank>>,
  perks: PerkStatus[],
  birthday: Date | null
): UserRankInfo {
  const tier = getRankTier(rankRecord.rank);
  const next = getNextRank(rankRecord.rank);

  return {
    rank: rankRecord.rank,
    label: tier.label,
    rankStartedAt: rankRecord.rankStartedAt.toISOString(),
    rankExpiresAt: rankRecord.rankExpiresAt.toISOString(),
    perks,
    hasBirthday: Boolean(birthday),
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

    const dbUser =
      (await db.findUserById(user.id)) ??
      (await db.createUser({
        id: user.id,
        email: user.email!,
        name: user.user_metadata?.name || null,
      }));
    const birthday = dbUser.birthday;

    if (req.method === 'GET') {
      try {
        const rankRecord = await db.getUserRank(user.id);
        const perks = await loadPerks(user.id, rankRecord.rank, birthday);
        return res.status(200).json(buildRankInfo(rankRecord, perks, birthday));
      } catch (error) {
        if (isRanksSchemaMissingError(error)) {
          return res.status(200).json({
            rank: 'silver',
            label: 'Silver',
            rankStartedAt: new Date().toISOString(),
            rankExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            perks: await loadPerks(user.id, 'silver', birthday),
            hasBirthday: Boolean(birthday),
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
      const perks = await loadPerks(user.id, rankRecord.rank, birthday);
      return res.status(200).json({
        message: `Congratulations! You are now a ${getRankTier(rankRecord.rank).label} member!`,
        rankInfo: buildRankInfo(rankRecord, perks, birthday),
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
