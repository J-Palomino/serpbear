import type { NextApiRequest, NextApiResponse } from 'next';
import { Op } from 'sequelize';
import db from '../../database/database';
import User from '../../database/models/user';
import { requireAuth } from '../../utils/roleMiddleware';

type ProfileResponse = {
   user?: any;
   success?: boolean;
   error?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ProfileResponse>) {
   await db.sync();

   if (req.method === 'GET') {
      return getProfile(req, res);
   }
   if (req.method === 'PUT') {
      return updateProfile(req, res);
   }
   return res.status(405).json({ error: 'Method not allowed' });
}

const getProfile = async (req: NextApiRequest, res: NextApiResponse<ProfileResponse>) => {
   const currentUser = await requireAuth(req, res);
   if (!currentUser) return;

   try {
      const user = await User.findByPk(currentUser.userId, {
         attributes: ['ID', 'email', 'username', 'role', 'lastLogin', 'createdAt'],
      });

      if (!user) {
         res.status(404).json({ error: 'User not found' });
         return;
      }

      res.status(200).json({ user: user.get({ plain: true }) });
   } catch (error) {
      console.error('[ERROR] Getting profile:', error);
      res.status(500).json({ error: 'Error fetching profile' });
   }
};

const updateProfile = async (req: NextApiRequest, res: NextApiResponse<ProfileResponse>) => {
   const currentUser = await requireAuth(req, res);
   if (!currentUser) return;

   const { email, username, currentPassword, newPassword } = req.body;

   try {
      const user = await User.findByPk(currentUser.userId);

      if (!user) {
         res.status(404).json({ error: 'User not found' });
         return;
      }

      const updateData: any = {};

      if (email && email !== user.email) {
         const existingEmail = await User.findOne({
            where: { email, ID: { [Op.ne]: user.ID } },
         });
         if (existingEmail) {
            res.status(400).json({ error: 'Email already in use' });
            return;
         }
         updateData.email = email;
      }

      if (username && username !== user.username) {
         const existingUsername = await User.findOne({
            where: { username, ID: { [Op.ne]: user.ID } },
         });
         if (existingUsername) {
            res.status(400).json({ error: 'Username already in use' });
            return;
         }
         updateData.username = username;
      }

      if (newPassword) {
         if (!currentPassword) {
            res.status(400).json({ error: 'Current password is required to change password' });
            return;
         }
         const isValid = await user.validatePassword(currentPassword);
         if (!isValid) {
            res.status(400).json({ error: 'Current password is incorrect' });
            return;
         }
         if (newPassword.length < 6) {
            res.status(400).json({ error: 'New password must be at least 6 characters' });
            return;
         }
         updateData.password = newPassword;
      }

      if (Object.keys(updateData).length > 0) {
         await user.update(updateData);
      }

      res.status(200).json({
         success: true,
         user: {
            ID: user.ID,
            email: user.email,
            username: user.username,
            role: user.role,
         },
      });
   } catch (error) {
      console.error('[ERROR] Updating profile:', error);
      res.status(500).json({ error: 'Error updating profile' });
   }
};
