import type { GameRewardType } from '../rewards/types';

export interface Prize {
  rewardType: GameRewardType;
  label: string;
  detail: string;
  rare: boolean;
}

// Weights are relative, so they don't need to add up to 100
export const PRIZE_TABLE: Array<Prize & { weight: number }> = [
  { rewardType: 'game_free_drink', label: 'Free Drink', detail: 'Any non-alcoholic drink', rare: false, weight: 35 },
  { rewardType: 'game_free_addon', label: 'Free Roll Add-on', detail: 'Avocado, soy paper, extra sauce and more', rare: false, weight: 30 },
  { rewardType: 'game_free_appetizer', label: 'Free Appetizer', detail: 'Any appetizer on the menu', rare: false, weight: 25 },
  { rewardType: 'game_rare_5', label: '5% Off House Special Rolls', detail: 'Every House Special Roll in one order', rare: true, weight: 8 },
  { rewardType: 'game_rare_10', label: '10% Off House Special Rolls', detail: 'Every House Special Roll in one order', rare: true, weight: 2 },
];

export const PRIZE_LIFETIME_DAYS = 7;

export function getPrizeByRewardType(rewardType: string): Prize | undefined {
  const match = PRIZE_TABLE.find((p) => p.rewardType === rewardType);
  if (!match) return undefined;
  const { weight: _weight, ...prize } = match;
  return prize;
}

// Server only: a prize rolled in the browser could be faked.
// `luckyBoost` multiplies the rare weights (Conveyor Catch's gold plate).
export function rollPrize(luckyBoost = 1): Prize {
  const weighted = PRIZE_TABLE.map((p) => ({ ...p, weight: p.rare ? p.weight * luckyBoost : p.weight }));
  const total = weighted.reduce((sum, p) => sum + p.weight, 0);
  let pick = Math.random() * total;
  const won = weighted.find((p) => (pick -= p.weight) < 0) ?? weighted[weighted.length - 1];
  return getPrizeByRewardType(won.rewardType)!;
}
