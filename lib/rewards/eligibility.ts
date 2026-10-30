import { dinnerMenu, ROLL_ADDON_OPTION } from '../../data/menuData';

export interface RewardEligibleItem {
  name: string;
  price: number;
  quantity: number;
  options?: { [key: string]: string };
}

const namesInCategory = (category: string) =>
  new Set(
    dinnerMenu
      .find((c) => c.category === category)
      ?.items.map((item) => item.name.toLowerCase()) ?? []
  );

export const appetizerItemNames = namesInCategory('Appetizers');

export const houseSpecialRollItemNames = namesInCategory('House Special Rolls');

// Beer and sake are left out on purpose: the game's free drink is non-alcoholic only.
export const drinkItemNames = namesInCategory('Beverages (Non-alcoholic)');

// Prices of the roll add-ons on one cart item, one entry per add-on. MenuItem
// joins multi-select choices with ', ' (see splitChoices in lib/menu/pricing.ts).
export function rollAddonPrices(item: RewardEligibleItem): number[] {
  const value = item.options?.[ROLL_ADDON_OPTION.name];
  if (!value) return [];
  return value
    .split(',')
    .map((choice) => ROLL_ADDON_OPTION.addonPrices?.[choice.trim()])
    .filter((price): price is number => price !== undefined);
}
