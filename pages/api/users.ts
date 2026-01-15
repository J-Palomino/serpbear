import type { NextApiRequest, NextApiResponse } from 'next';
import { Op } from 'sequelize';
import db from '../../database/database';
import User from '../../database/models/user';
import { requireRole } from '../../utils/roleMiddleware';

type UsersResponse = {
   users?: any[];
   user?: any;
   success?: boolean;
   error?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<UsersResponse>) {
   await db.sync();

   if (req.method === 'GET') {
      return getUsers(req, res);
   }
   if (req.method === 'POST') {
      return createUser(req, res);
   }
   if (req.method === 'PUT') {
      return updateUser(req, res);
   }
   if (req.method === 'DELETE') {
      return deleteUser(req, res);
   }
   return res.status(405).json({ error: 'Method not allowed' });
}

const getUsers = async (req: NextApiRequest, res: NextApiResponse<UsersResponse>) => {
   const user = await requireRole(['admin'])(req, res);
   if (!user) return;

   try {
      const users = await User.findAll({
         attributes: ['ID', 'email', 'username', 'role', 'isActive', 'lastLogin', 'createdAt'],
         order: [['createdAt', 'DESC']],
      });
      res.status(200).json({ users: users.map((u) => u.get({ plain: true })) });
   } catch (error) {
      console.error('[ERROR] Getting users:', error);
      res.status(500).json({ error: 'Error fetching users' });
   }
};

const createUser = async (req: NextApiRequest, res: NextApiResponse<UsersResponse>) => {
   const currentUser = await requireRole(['admin'])(req, res);
   if (!currentUser) return;

   const { email, username, password, role } = req.body;

   if (!email || !username || !password) {
      res.status(400).json({ error: 'Email, username, and password are required' });
      return;
   }

   // Validate role
   const validRoles = ['admin', 'editor', 'viewer'];
   if (role && !validRoles.includes(role)) {
      res.status(400).json({ error: 'Invalid role. Must be admin, editor, or viewer' });
      return;
   }

   try {
      const existingUser = await User.findOne({
         where: {
            [Op.or]: [{ email }, { username }],
         },
      });

      if (existingUser) {
         res.status(400).json({ error: 'User with this email or username already exists' });
         return;
      }

      const newUser = await User.create({
         email,
         username,
         password,
         role: role || 'viewer',
         apiKey: User.generateApiKey(),
      });

      res.status(201).json({
         user: {
            ID: newUser.ID,
            email: newUser.email,
            username: newUser.username,
            role: newUser.role,
            isActive: newUser.isActive,
            createdAt: newUser.createdAt,
         },
      });
   } catch (error) {
      console.error('[ERROR] Creating user:', error);
      res.status(500).json({ error: 'Error creating user' });
   }
};

const updateUser = async (req: NextApiRequest, res: NextApiResponse<UsersResponse>) => {
   const currentUser = await requireRole(['admin'])(req, res);
   if (!currentUser) return;

   const { id } = req.query;
   const { email, username, password, role, isActive } = req.body;

   if (!id) {
      res.status(400).json({ error: 'User ID is required' });
      return;
   }

   try {
      const userToUpdate = await User.findByPk(Number(id));
      if (!userToUpdate) {
         res.status(404).json({ error: 'User not found' });
         return;
      }

      // Prevent removing the last admin
      if (userToUpdate.role === 'admin' && role && role !== 'admin') {
         const adminCount = await User.count({ where: { role: 'admin', isActive: true } });
         if (adminCount <= 1) {
            res.status(400).json({ error: 'Cannot demote the last admin user' });
            return;
         }
      }

      // Prevent deactivating the last admin
      if (userToUpdate.role === 'admin' && isActive === false) {
         const adminCount = await User.count({ where: { role: 'admin', isActive: true } });
         if (adminCount <= 1) {
            res.status(400).json({ error: 'Cannot deactivate the last admin user' });
            return;
         }
      }

      const updateData: any = {};
      if (email && email !== userToUpdate.email) {
         // Check if email is already taken
         const existingEmail = await User.findOne({ where: { email, ID: { [Op.ne]: userToUpdate.ID } } });
         if (existingEmail) {
            res.status(400).json({ error: 'Email already in use' });
            return;
         }
         updateData.email = email;
      }
      if (username && username !== userToUpdate.username) {
         // Check if username is already taken
         const existingUsername = await User.findOne({ where: { username, ID: { [Op.ne]: userToUpdate.ID } } });
         if (existingUsername) {
            res.status(400).json({ error: 'Username already in use' });
            return;
         }
         updateData.username = username;
      }
      if (password) updateData.password = password;
      if (role) updateData.role = role;
      if (typeof isActive === 'boolean') updateData.isActive = isActive;

      await userToUpdate.update(updateData);

      res.status(200).json({
         user: {
            ID: userToUpdate.ID,
            email: userToUpdate.email,
            username: userToUpdate.username,
            role: userToUpdate.role,
            isActive: userToUpdate.isActive,
         },
      });
   } catch (error) {
      console.error('[ERROR] Updating user:', error);
      res.status(500).json({ error: 'Error updating user' });
   }
};

const deleteUser = async (req: NextApiRequest, res: NextApiResponse<UsersResponse>) => {
   const currentUser = await requireRole(['admin'])(req, res);
   if (!currentUser) return;

   const { id } = req.query;

   if (!id) {
      res.status(400).json({ error: 'User ID is required' });
      return;
   }

   try {
      const userToDelete = await User.findByPk(Number(id));
      if (!userToDelete) {
         res.status(404).json({ error: 'User not found' });
         return;
      }

      // Prevent deleting self
      if (userToDelete.ID === currentUser.userId) {
         res.status(400).json({ error: 'Cannot delete your own account' });
         return;
      }

      // Prevent removing the last admin
      if (userToDelete.role === 'admin') {
         const adminCount = await User.count({ where: { role: 'admin', isActive: true } });
         if (adminCount <= 1) {
            res.status(400).json({ error: 'Cannot delete the last admin user' });
            return;
         }
      }

      await userToDelete.destroy();
      res.status(200).json({ success: true });
   } catch (error) {
      console.error('[ERROR] Deleting user:', error);
      res.status(500).json({ error: 'Error deleting user' });
   }
};
