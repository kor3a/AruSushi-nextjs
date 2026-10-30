import {
  appetizerItemNames,
  drinkItemNames,
  houseSpecialRollItemNames,
  rollAddonPrices,
  type RewardEligibleItem,
} from '../rewards/eligibility';
import type { RewardType } from '../rewards/types';
import { PERCENT_OFF_CAP, PERCENT_OFF_RATE } from './config';
import type { PerkType } from './types';

export interface OrderDiscounts {
  rewardDiscount: number;
  perkDiscounts: Partial<Record<PerkType, number>>;
  totalDiscount: number;
}

const round2 = (value: number) => Number(value.toFixed(2));

// Game prizes that take a share of every House Special Roll in the order
const RARE_ROLL_RATES: Partial<Record<RewardType, number>> = {
  game_rare_5: 0.05,
  game_rare_10: 0.1,
};

function isEligible(name: string, coupon: RewardType | PerkType): boolean {
  switch (coupon) {
    case 'free_appetizer':
    case 'monthly_free_appetizer':
    case 'game_free_appetizer':
      return appetizerItemNames.has(name);
    case 'free_house_special_roll':
    case 'monthly_free_roll':
      return houseSpecialRollItemNames.has(name);
    case 'birthday_treat':
      return appetizerItemNames.has(name) || houseSpecialRollItemNames.has(name);
    case 'game_free_drink':
      return drinkItemNames.has(name);
    default:
      return false;
  }
}

// Shared by checkout and the order/payment APIs so the client's total and the
// server's always agree. Each free-item coupon claims one unit of the priciest
// eligible item not already claimed by another coupon, so a points reward and
// a monthly appetizer can't both discount the same plate. Game prizes that
// discount part of an item (a free add-on, % off rolls) only look at units no
// coupon has made free. The 10% coupon is applied last, to what's left.
export function calculateOrderDiscounts(
  items: RewardEligibleItem[],
  rewardType: RewardType | null | undefined,
  perks: PerkType[]
): OrderDiscounts {
  const units = items
    .flatMap((item) =>
      item.quantity > 0
        ? Array.from({ length: Math.floor(item.quantity) }, () => ({
            name: item.name.toLowerCase(),
            price: item.price,
            addons: rollAddonPrices(item),
            claimed: false,
          }))
        : []
    )
    .sort((a, b) => b.price - a.price);

  const claim = (coupon: RewardType | PerkType): number => {
    const unit = units.find((u) => !u.claimed && isEligible(u.name, coupon));
    if (!unit) return 0;
    unit.claimed = true;
    return round2(unit.price);
  };

  const rareRate = rewardType ? RARE_ROLL_RATES[rewardType] : undefined;
  const isPartialReward = rewardType === 'game_free_addon' || rareRate !== undefined;
  let rewardDiscount = rewardType && !isPartialReward ? claim(rewardType) : 0;
  const perkDiscounts: Partial<Record<PerkType, number>> = {};

  // Most specific first, so the birthday treat (either category) takes what's left.
  for (const perk of ['monthly_free_appetizer', 'monthly_free_roll', 'birthday_treat'] as const) {
    if (perks.includes(perk)) {
      perkDiscounts[perk] = claim(perk);
    }
  }

  const unclaimed = units.filter((u) => !u.claimed);
  if (rewardType === 'game_free_addon') {
    rewardDiscount = round2(Math.max(0, ...unclaimed.flatMap((u) => u.addons)));
  } else if (rareRate !== undefined) {
    const rollTotal = unclaimed
      .filter((u) => houseSpecialRollItemNames.has(u.name))
      .reduce((sum, u) => sum + u.price, 0);
    rewardDiscount = round2(rollTotal * rareRate);
  }

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemDiscounts =
    rewardDiscount + Object.values(perkDiscounts).reduce((sum, d) => sum + (d ?? 0), 0);

  if (perks.includes('monthly_percent_off')) {
    const remaining = Math.max(subtotal - itemDiscounts, 0);
    perkDiscounts.monthly_percent_off = round2(Math.min(remaining * PERCENT_OFF_RATE, PERCENT_OFF_CAP));
  }

  const totalDiscount = round2(
    rewardDiscount + Object.values(perkDiscounts).reduce((sum, d) => sum + (d ?? 0), 0)
  );

  return { rewardDiscount, perkDiscounts, totalDiscount };
}
