export type RewardType = 'free_appetizer' | 'free_house_special_roll';

export interface RewardCatalogItem {
  type: RewardType;
  label: string;
  pointsCost: number;
  description: string;
}

export interface RewardRedemption {
  id: string;
  rewardType: RewardType;
  rewardLabel: string;
  pointsCost: number;
  status: 'available' | 'used' | 'cancelled';
  claimedAt: string;
  usedAt?: string | null;
  orderId?: string | null;
}

export interface RewardsSummary {
  pointsBalance: number;
  lifetimePointsEarned: number;
  lifetimePointsRedeemed: number;
  pointsPerDollar: number;
  rewardsCatalog: RewardCatalogItem[];
  availableRedemptions: RewardRedemption[];
}
