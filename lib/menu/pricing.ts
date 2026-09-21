import {
  lunchMenu,
  dinnerMenu,
  MenuCategory,
  MenuItemData,
  MenuItemOption,
} from '../../data/menuData';

/** Admin price overrides, keyed by `${menuType}::${category}::${itemName}`. */
export type PriceOverrides = Record<string, number>;

export function overrideKey(menuType: string, category: string, itemName: string): string {
  return `${menuType}::${category}::${itemName}`;
}

export interface SubmittedItem {
  name: string;
  price: number;
  quantity: number;
  options?: { [key: string]: string };
}

interface MenuLocation {
  menuType: 'lunch' | 'dinner';
  category: string;
  item: MenuItemData;
}

const PRICE_EPSILON = 0.005;

function buildIndex(): Map<string, MenuLocation[]> {
  const index = new Map<string, MenuLocation[]>();

  const add = (menuType: 'lunch' | 'dinner', menu: MenuCategory[]) => {
    for (const category of menu) {
      for (const item of category.items) {
        const key = item.name.trim().toLowerCase();
        const existing = index.get(key);
        const location: MenuLocation = { menuType, category: category.category, item };
        if (existing) {
          existing.push(location);
        } else {
          index.set(key, [location]);
        }
      }
    }
  };

  add('lunch', lunchMenu);
  add('dinner', dinnerMenu);
  return index;
}

// The menu is a static module, so the index is built once per process.
const menuIndex = buildIndex();

/**
 * Split a cart option value back into the choices the customer selected.
 *
 * MenuItem joins multi-select choices with ', ' before putting them in the
 * cart (components/menu/MenuItem.tsx), so this reverses that.
 */
function splitChoices(value: string): string[] {
  return value
    .split(',')
    .map((choice) => choice.trim())
    .filter(Boolean);
}

/**
 * Recompute an item's price from the menu.
 *
 * This deliberately mirrors calculatePrice() in components/menu/MenuItem.tsx,
 * including its quirk that a matching `choicePrices` entry REPLACES the base
 * price (and therefore any admin override) rather than adding to it. Diverging
 * here would reject legitimate carts.
 */
function priceAtLocation(
  location: MenuLocation,
  selectedOptions: { [key: string]: string } | undefined,
  overrides: PriceOverrides
): number {
  const { menuType, category, item } = location;
  const base = overrides[overrideKey(menuType, category, item.name)] ?? item.price;

  const options: MenuItemOption[] | undefined = item.options;
  if (!options || options.length === 0) {
    return base;
  }

  let price = base;
  const selected = selectedOptions || {};

  // A priced choice replaces the base price; first match wins.
  for (const option of options) {
    const value = selected[option.name];
    if (option.choicePrices && typeof value === 'string' && value) {
      const choicePrice = option.choicePrices[value];
      if (choicePrice !== undefined) {
        price = choicePrice;
        break;
      }
    }
  }

  // Add-ons stack on top.
  for (const option of options) {
    if (option.addonPrices && option.isMultiSelect) {
      const value = selected[option.name];
      if (typeof value !== 'string' || !value) continue;
      for (const addon of splitChoices(value)) {
        const addonPrice = option.addonPrices[addon];
        if (addonPrice !== undefined) {
          price += addonPrice;
        }
      }
    }
  }

  return Number(price.toFixed(2));
}

/**
 * Can this menu entry explain the options the customer submitted?
 *
 * An item name can appear on both the lunch and dinner menus with different
 * option sets - "Ramen" has add-ons at lunch and none at dinner. Without this
 * filter a cart could claim the lunch add-ons while paying the bare dinner
 * price, because the dinner entry ignores the options and still validates.
 */
function explainsOptions(
  location: MenuLocation,
  selectedOptions: { [key: string]: string } | undefined
): boolean {
  const submittedKeys = Object.entries(selectedOptions || {})
    .filter(([, value]) => typeof value === 'string' && value.trim() !== '')
    .map(([key]) => key);

  if (submittedKeys.length === 0) return true;

  const defined = new Set((location.item.options || []).map((option) => option.name));
  return submittedKeys.every((key) => defined.has(key));
}

/**
 * Every price this item could legitimately have.
 *
 * The cart does not record which menu an item came from, so when a name is on
 * both menus any of the candidates is accepted - but only from entries that
 * actually define the submitted options.
 */
export function candidatePrices(
  item: SubmittedItem,
  overrides: PriceOverrides
): number[] {
  const locations = menuIndex.get(item.name.trim().toLowerCase());
  if (!locations || locations.length === 0) {
    return [];
  }

  // Prefer entries that define the submitted options. If none does, the
  // options are meaningless, so fall back to every entry at its base price -
  // that still prices add-ons at zero, which gains a forged cart nothing.
  const compatible = locations.filter((location) => explainsOptions(location, item.options));
  const considered = compatible.length > 0 ? compatible : locations;

  const prices = considered.map((location) =>
    priceAtLocation(location, item.options, overrides)
  );
  return Array.from(new Set(prices));
}

export interface PriceValidationError {
  name: string;
  submittedPrice: number;
  reason: 'unknown_item' | 'price_mismatch';
  expectedPrices?: number[];
}

/**
 * Verify that every submitted item exists on the menu and carries a price the
 * menu actually supports. This is the server-side guard against a forged cart.
 */
export function validateSubmittedItems(
  items: SubmittedItem[],
  overrides: PriceOverrides
): PriceValidationError[] {
  const errors: PriceValidationError[] = [];

  for (const item of items) {
    const expected = candidatePrices(item, overrides);

    if (expected.length === 0) {
      errors.push({
        name: item.name,
        submittedPrice: item.price,
        reason: 'unknown_item',
      });
      continue;
    }

    const matches = expected.some(
      (price) => Math.abs(price - item.price) < PRICE_EPSILON
    );

    if (!matches) {
      errors.push({
        name: item.name,
        submittedPrice: item.price,
        reason: 'price_mismatch',
        expectedPrices: expected,
      });
    }
  }

  return errors;
}

/** Subtotal computed from menu prices, ignoring whatever the client sent. */
export function trustedSubtotal(
  items: SubmittedItem[],
  overrides: PriceOverrides
): number {
  const total = items.reduce((sum, item) => {
    const expected = candidatePrices(item, overrides);
    if (expected.length === 0) return sum;
    // Prefer the candidate the client submitted when it is valid, so a
    // lunch/dinner ambiguity resolves the same way the cart displayed it.
    const match =
      expected.find((price) => Math.abs(price - item.price) < PRICE_EPSILON) ??
      Math.min(...expected);
    return sum + match * item.quantity;
  }, 0);
  return Number(total.toFixed(2));
}

export function describePriceErrors(errors: PriceValidationError[]): string {
  return errors
    .map((error) =>
      error.reason === 'unknown_item'
        ? `"${error.name}" is not on the menu`
        : `"${error.name}" was submitted at $${error.submittedPrice.toFixed(2)} but the menu price is ${(error.expectedPrices || [])
            .map((price) => `$${price.toFixed(2)}`)
            .join(' or ')}`
    )
    .join('; ');
}
