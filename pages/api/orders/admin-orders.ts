import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../lib/db';
import { getUserRoleByEmail, canManageOrders } from '../../../lib/auth/roles';
import { createApiClient } from '../../../lib/supabase/server';

function parseStartDate(value?: string | string[]): Date | undefined {
  if (!value || Array.isArray(value)) {
    return undefined;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date;
}

function parseEndDate(value?: string | string[]): Date | undefined {
  if (!value || Array.isArray(value)) {
    return undefined;
  }

  const date = new Date(`${value}T23:59:59.999Z`);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const supabase = createApiClient(req, res);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!canManageOrders(user.email)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const role = getUserRoleByEmail(user.email);
    const startDate = parseStartDate(req.query.startDate);
    const endDate = parseEndDate(req.query.endDate);

    if (startDate && endDate && startDate > endDate) {
      return res.status(400).json({ message: 'startDate must be before endDate' });
    }

    const orders = await db.findAllOrdersByDateRange(startDate, endDate);

    return res.status(200).json({
      role,
      filters: {
        startDate: startDate?.toISOString() || null,
        endDate: endDate?.toISOString() || null,
      },
      orders,
    });
  } catch (error: any) {
    console.error('Error fetching admin orders:', error);
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
}
