export type MemberRank = 'silver' | 'rose_gold' | 'platinum' | 'diamond';

export interface RankTier {
  rank: MemberRank;
  label: string;
  color: string;
  bgGradient: string;
  upgradeCost: number | null;
  discountPercent: number;
  benefits: string[];
}

export interface UserRankInfo {
  rank: MemberRank;
  label: string;
  rankStartedAt: string;
  rankExpiresAt: string;
  discountPercent: number;
  freeAppetizerClaimed: boolean;
  freeRollClaimed: boolean;
  lastMonthlyAppetizerAt: string | null;
  nextUpgrade: {
    rank: MemberRank;
    label: string;
    cost: number;
  } | null;
}
