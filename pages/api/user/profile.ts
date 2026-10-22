import { NextApiRequest, NextApiResponse } from 'next';
import { createApiClient } from '../../../lib/supabase/server';
import { db } from '../../../lib/db';
import { getUserRoleByEmail } from '../../../lib/auth/roles';
import { parseBirthday } from '../../../lib/perks/birthday';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Check if user is authenticated with Supabase
  const supabase = createApiClient(req, res);
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      let dbUser = await db.findUserById(user.id);

      // If user doesn't exist in our DB, create them
      if (!dbUser) {
        dbUser = await db.createUser({
          id: user.id,
          email: user.email!,
          name: user.user_metadata?.name || null,
        });
      }

      return res.status(200).json({
        user: {
          id: dbUser.id,
          email: dbUser.email,
          role: getUserRoleByEmail(dbUser.email),
          name: dbUser.name,
          phone: dbUser.phone,
          address: dbUser.address,
          birthday: dbUser.birthday,
          createdAt: dbUser.createdAt,
          updatedAt: dbUser.updatedAt,
        },
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      return res.status(500).json({ message: 'Error fetching profile' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { name, phone, address, birthday } = req.body;

      // Ensure user exists in our database
      let dbUser = await db.findUserById(user.id);
      if (!dbUser) {
        dbUser = await db.createUser({
          id: user.id,
          email: user.email!,
          name: name || null,
        });
      }

      // A birthday can be added once; after that only an admin can change it.
      let birthdayDate: Date | undefined;
      if (birthday) {
        if (dbUser.birthday) {
          return res.status(400).json({
            message: 'Your birthday is already set. Please contact the restaurant to change it.',
          });
        }
        const parsed = parseBirthday(birthday);
        if (!parsed) {
          return res.status(400).json({ message: 'Please enter a valid birthday' });
        }
        birthdayDate = parsed;
      }

      // Update profile
      await db.updateUser(user.id, {
        name: name || undefined,
        phone: phone || undefined,
        address: address || undefined,
        birthday: birthdayDate,
      });

      const updatedUser = await db.findUserById(user.id);
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      return res.status(200).json({
        message: 'Profile updated successfully',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          role: getUserRoleByEmail(updatedUser.email),
          name: updatedUser.name,
          phone: updatedUser.phone,
          address: updatedUser.address,
          birthday: updatedUser.birthday,
          createdAt: updatedUser.createdAt,
          updatedAt: updatedUser.updatedAt,
        },
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      return res.status(500).json({ message: 'Error updating profile' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
