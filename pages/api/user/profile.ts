import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/auth/config';
import { db } from '../../../lib/db';
import bcrypt from 'bcryptjs';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const user = await db.findUserById(session.user.id);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Don't send password to client
      const { password, ...userWithoutPassword } = user;
      return res.status(200).json({ user: userWithoutPassword });
    } catch (error) {
      return res.status(500).json({ message: 'Error fetching profile' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { name, phone, address, currentPassword, newPassword } = req.body;

      // If changing password, verify current password
      if (newPassword) {
        if (!currentPassword) {
          return res.status(400).json({ message: 'Current password is required to set a new password' });
        }

        const user = await db.findUserById(session.user.id);
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }

        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
          return res.status(400).json({ message: 'Current password is incorrect' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.updateUser(session.user.id, {
          name: name || user.name,
          phone: phone || user.phone,
          address: address || user.address,
          password: hashedPassword,
        });
      } else {
        // Update profile without password change
        await db.updateUser(session.user.id, {
          name: name || null,
          phone: phone || null,
          address: address || null,
        });
      }

      const updatedUser = await db.findUserById(session.user.id);
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      const { password, ...userWithoutPassword } = updatedUser;
      return res.status(200).json({
        message: 'Profile updated successfully',
        user: userWithoutPassword
      });
    } catch (error) {
      return res.status(500).json({ message: 'Error updating profile' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
