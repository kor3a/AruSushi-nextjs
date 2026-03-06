import type { NextApiRequest, NextApiResponse } from 'next';
import { createApiClient } from '../../../lib/supabase/server';
import { canManageOrders } from '../../../lib/auth/roles';
import { prisma } from '../../../lib/db';

interface MenuPriceRow {
  id: number;
  menu_type: string;
  category: string;
  item_name: string;
  price: number;
  updated_by: string | null;
  updated_at: Date;
}

function isMenuPricesMissingError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const e = error as { code?: string; message?: string; meta?: { message?: string } };
  if (e.code !== 'P2010') return false;
  const msg = `${e.message || ''} ${e.meta?.message || ''}`.toLowerCase();
  return msg.includes('relation "menu_prices" does not exist');
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    return handleGet(req, res);
  }
  if (req.method === 'PATCH') {
    return handlePatch(req, res);
  }
  return res.status(405).json({ message: 'Method not allowed' });
}

async function handleGet(_req: NextApiRequest, res: NextApiResponse) {
  try {
    const rows = await prisma.$queryRaw<MenuPriceRow[]>`
      SELECT id, menu_type, category, item_name, price, updated_by, updated_at
      FROM menu_prices
      ORDER BY menu_type, category, item_name
    `;

    const priceOverrides: Record<string, number> = {};
    for (const row of rows) {
      const key = `${row.menu_type}::${row.category}::${row.item_name}`;
      priceOverrides[key] = Number(row.price);
    }

    return res.status(200).json({ priceOverrides });
  } catch (error) {
    if (isMenuPricesMissingError(error)) {
      return res.status(200).json({ priceOverrides: {} });
    }
    console.error('Failed to fetch menu prices:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function handlePatch(req: NextApiRequest, res: NextApiResponse) {
  try {
    const supabase = createApiClient(req, res);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!canManageOrders(user.email)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const { updates } = req.body as {
      updates: { menuType: string; category: string; itemName: string; price: number }[];
    };

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ message: 'No updates provided' });
    }

    for (const update of updates) {
      if (
        !update.menuType ||
        !update.category ||
        !update.itemName ||
        typeof update.price !== 'number' ||
        update.price < 0
      ) {
        return res.status(400).json({
          message: `Invalid update: ${JSON.stringify(update)}`,
        });
      }
    }

    for (const update of updates) {
      await prisma.$executeRaw`
        INSERT INTO menu_prices (menu_type, category, item_name, price, updated_by, updated_at)
        VALUES (${update.menuType}, ${update.category}, ${update.itemName}, ${update.price}, ${user.email}, NOW())
        ON CONFLICT (menu_type, category, item_name)
        DO UPDATE SET price = ${update.price}, updated_by = ${user.email}, updated_at = NOW()
      `;
    }

    return res.status(200).json({ message: `${updates.length} price(s) updated` });
  } catch (error) {
    if (isMenuPricesMissingError(error)) {
      return res.status(503).json({
        message: 'Menu prices table not set up. Please run the add_menu_prices.sql migration.',
      });
    }
    console.error('Update menu prices error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
