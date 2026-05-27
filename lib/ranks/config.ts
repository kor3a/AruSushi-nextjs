import type { MemberRank, RankTier } from './types';

export const RANK_ORDER: MemberRank[] = ['silver', 'rose_gold', 'platinum', 'diamond'];

export const RANK_TIERS: Record<MemberRank, RankTier> = {
  silver: {
    rank: 'silver',
    label: 'Silver',
    color: '#C0C0C0',
    bgGradient: 'linear-gradient(135deg, #C0C0C0 0%, #A8A8A8 50%, #808080 100%)',
    upgradeCost: null,
    discountPercent: 0,
    benefits: [
      'Collect sushi points on every order',
    ],
  },
  rose_gold: {
    rank: 'rose_gold',
    label: 'Rose Gold',
    color: '#E8A87C',
    bgGradient: 'linear-gradient(135deg, #F4C4A0 0%, #E8A87C 50%, #C48B65 100%)',
    upgradeCost: 500,
    discountPercent: 2,
    benefits: [
      'Collect sushi points on every order',
      'Birthday rewards',
      
    ],
  },
  platinum: {
    rank: 'platinum',
    label: 'Platinum',
    color: '#B0C4DE',
    bgGradient: 'linear-gradient(135deg, #D6E4F0 0%, #B0C4DE 50%, #8FAABE 100%)',
    upgradeCost: 1500,
    discountPercent: 5,
    benefits: [
      'Collect sushi points on every order',
      'Birthday rewards',
      'One-time free appetizer',
      
    ],
  },
  diamond: {
    rank: 'diamond',
    label: 'Diamond',
    color: '#B9F2FF',
    bgGradient: 'linear-gradient(135deg, #E0F7FA 0%, #B9F2FF 50%, #81D4FA 100%)',
    upgradeCost: 4500,
    discountPercent: 10,
    benefits: [
      'Collect sushi points on every order',
      'Birthday rewards',
      'Free appetizer every month',
      'One-time free roll',
      
    ],
  },
};

export function getRankTier(rank: MemberRank): RankTier {
  return RANK_TIERS[rank];
}

export function getNextRank(currentRank: MemberRank): MemberRank | null {
  const idx = RANK_ORDER.indexOf(currentRank);
  if (idx === -1 || idx >= RANK_ORDER.length - 1) return null;
  return RANK_ORDER[idx + 1];
}

export function getUpgradeCost(targetRank: MemberRank): number | null {
  return RANK_TIERS[targetRank].upgradeCost;
}

export function getDiscountPercent(rank: MemberRank): number {
  return RANK_TIERS[rank].discountPercent;
}

export function isValidRank(value: string): value is MemberRank {
  return RANK_ORDER.includes(value as MemberRank);
}
