import type { NextApiRequest, NextApiResponse } from 'next';
import { createApiClient } from '../../../lib/supabase/server';
import { getUserRoleByEmail } from '../../../lib/auth/roles';
import { db, prisma } from '../../../lib/db';
import { parseBirthday } from '../../../lib/perks/birthday';

// Members can add a birthday once; changing or clearing it afterwards is
// admin-only (not managers), since it controls the birthday perk.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const supabase = createApiClient(req, res);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (getUserRoleByEmail(user.email) !== 'admin') {
      return res.status(403).json({ message: 'Only admins can change member birthdays' });
    }

    const email = String((req.method === 'GET' ? req.query.email : req.body?.email) || '')
      .trim()
      .toLowerCase();
    if (!email) {
      return res.status(400).json({ message: 'Member email is required' });
    }

    const member = await prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
    });
    if (!member) {
      return res.status(404).json({ message: 'No member found with that email' });
    }

    if (req.method === 'PUT') {
      const { birthday } = req.body as { birthday?: string | null };
      let birthdayDate: Date | null = null;
      if (birthday) {
        birthdayDate = parseBirthday(birthday);
        if (!birthdayDate) {
          return res.status(400).json({ message: 'Please enter a valid birthday' });
        }
      }

      const updated = await db.updateUser(member.id, { birthday: birthdayDate });
      console.info('Admin changed member birthday:', {
        adminEmail: user.email,
        memberId: member.id,
        from: member.birthday,
        to: updated.birthday,
      });

      return res.status(200).json({
        member: { id: updated.id, email: updated.email, name: updated.name, birthday: updated.birthday },
      });
    }

    return res.status(200).json({
      member: { id: member.id, email: member.email, name: member.name, birthday: member.birthday },
    });
  } catch (error: any) {
    console.error('Admin member birthday API error:', error);
    return res.status(500).json({ message: error?.message || 'Internal server error' });
  }
}
