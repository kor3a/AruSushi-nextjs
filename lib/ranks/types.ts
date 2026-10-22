import type { PerkStatus } from '../perks/types';

export type MemberRank = 'silver' | 'rose_gold' | 'platinum' | 'diamond';

export interface RankTier {
  rank: MemberRank;
  label: string;
  color: string;
  bgGradient: string;
  upgradeCost: number | null;
  benefits: string[];
}

export interface UserRankInfo {
  rank: MemberRank;
  label: string;
  rankStartedAt: string;
  rankExpiresAt: string;
  // Monthly and birthday perks for the member's rank, with this period's availability.
  perks: PerkStatus[];
  hasBirthday: boolean;
  freeAppetizerClaimed: boolean;
  freeRollClaimed: boolean;
  lastMonthlyAppetizerAt: string | null;
  nextUpgrade: {
    rank: MemberRank;
    label: string;
    cost: number;
  } | null;
}
