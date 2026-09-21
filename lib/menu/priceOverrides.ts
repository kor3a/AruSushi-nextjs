import { prisma } from '../db';
import { PriceOverrides, overrideKey } from './pricing';

export type { PriceOverrides };

interface MenuPriceRow {
  menu_type: string;
  category: string;
  item_name: string;
  price: number;
}

export function isMenuPricesMissingError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const e = error as { code?: string; message?: string; meta?: { message?: string } };
  if (e.code !== 'P2010') return false;
  const msg = `${e.message || ''} ${e.meta?.message || ''}`.toLowerCase();
  return msg.includes('relation "menu_prices" does not exist');
}

/**
 * Load admin price overrides keyed by `${menuType}::${category}::${itemName}`.
 *
 * Returns an empty map when the menu_prices table has not been migrated yet,
 * which makes callers fall back to the prices baked into data/menuData.ts.
 */
export async function getMenuPriceOverrides(): Promise<PriceOverrides> {
  try {
    const rows = await prisma.$queryRaw<MenuPriceRow[]>`
      SELECT menu_type, category, item_name, price
      FROM menu_prices
    `;

    const overrides: PriceOverrides = {};
    for (const row of rows) {
      overrides[overrideKey(row.menu_type, row.category, row.item_name)] = Number(row.price);
    }
    return overrides;
  } catch (error) {
    if (isMenuPricesMissingError(error)) {
      return {};
    }
    throw error;
  }
}
