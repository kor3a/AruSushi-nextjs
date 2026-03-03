import type { RewardCatalogItem, RewardType } from './types';

export const POINTS_PER_DOLLAR = 1;

export const REWARD_CATALOG: RewardCatalogItem[] = [
  {
    type: 'free_appetizer',
    label: 'Free Appetizer',
    pointsCost: 120,
    description: 'Redeem for one free appetizer item in your cart.',
  },
  {
    type: 'free_house_special_roll',
    label: 'Free House Special Roll',
    pointsCost: 220,
    description: 'Redeem for one free house special roll in your cart.',
  },
];

export function getRewardByType(rewardType: string): RewardCatalogItem | undefined {
  return REWARD_CATALOG.find((reward) => reward.type === rewardType);
}

export function isRewardType(value: string): value is RewardType {
  return REWARD_CATALOG.some((reward) => reward.type === value);
}
