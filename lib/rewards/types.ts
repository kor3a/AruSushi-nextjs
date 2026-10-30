// Bought with points on the rewards page
export type PointsRewardType = 'free_appetizer' | 'free_house_special_roll';

// Won in the daily Conveyor Catch game (lib/minigames/prizes.ts)
export type GameRewardType =
  | 'game_free_drink'
  | 'game_free_addon'
  | 'game_free_appetizer'
  | 'game_rare_5'
  | 'game_rare_10';

export type RewardType = PointsRewardType | GameRewardType;

export interface RewardCatalogItem {
  type: PointsRewardType;
  label: string;
  pointsCost: number;
  description: string;
}

export interface RewardRedemption {
  id: string;
  rewardType: RewardType;
  rewardLabel: string;
  pointsCost: number;
  status: 'available' | 'used' | 'cancelled' | 'expired';
  claimedAt: string;
  usedAt?: string | null;
  expiresAt?: string | null;
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
