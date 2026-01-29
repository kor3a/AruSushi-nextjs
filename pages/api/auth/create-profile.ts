import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../lib/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { id, email, name, phone, address } = req.body;

    if (!id || !email) {
      return res.status(400).json({ message: 'User ID and email are required' });
    }

    // Create or update user profile in our database
    const user = await db.upsertUser({
      id,
      email,
      name: name || null,
    });

    // Update additional fields if provided
    if (phone || address) {
      await db.updateUser(id, {
        phone: phone || undefined,
        address: address || undefined,
      });
    }

    return res.status(201).json({
      message: 'Profile created successfully',
      user,
    });
  } catch (error) {
    console.error('Profile creation error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
