import { dinnerMenu } from '../../data/menuData';
import type { RewardType } from './types';

export interface RewardEligibleItem {
  name: string;
  price: number;
  quantity: number;
}

const appetizerItemNames = new Set(
  dinnerMenu
    .find((category) => category.category === 'Appetizers')
    ?.items.map((item) => item.name.toLowerCase()) ?? []
);

const houseSpecialRollItemNames = new Set(
  dinnerMenu
    .find((category) => category.category === 'House Special Rolls')
    ?.items.map((item) => item.name.toLowerCase()) ?? []
);

function getEligibleNameSet(rewardType: RewardType) {
  return rewardType === 'free_appetizer'
    ? appetizerItemNames
    : houseSpecialRollItemNames;
}

export function calculateRewardDiscount(
  rewardType: RewardType,
  items: RewardEligibleItem[]
): number {
  const eligibleNameSet = getEligibleNameSet(rewardType);

  let highestEligiblePrice = 0;
  for (const item of items) {
    if (item.quantity <= 0) {
      continue;
    }

    if (eligibleNameSet.has(item.name.toLowerCase())) {
      highestEligiblePrice = Math.max(highestEligiblePrice, item.price);
    }
  }

  return Number(highestEligiblePrice.toFixed(2));
}
