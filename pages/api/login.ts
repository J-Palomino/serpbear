import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import Cookies from 'cookies';
import { Op } from 'sequelize';
import db from '../../database/database';
import User from '../../database/models/user';

type LoginResponse = {
   success?: boolean;
   error?: string | null;
   user?: {
      id: number;
      username: string;
      email: string;
      role: string;
   };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
   if (req.method === 'POST') {
      return loginUser(req, res);
   }
   return res.status(401).json({ success: false, error: 'Invalid Method' });
}

const loginUser = async (req: NextApiRequest, res: NextApiResponse<LoginResponse>) => {
   await db.sync();

   // Support both JSON and form-encoded requests
   const { username, password } = req.body;

   if (!username || !password) {
      return res.status(401).json({ error: 'Username Password Missing' });
   }

   try {
      // Check if any users exist in the database
      const userCount = await User.count();

      // If no users exist, fall back to env var authentication (for initial setup)
      if (userCount === 0) {
         const envUserName = process.env.USER_NAME ? process.env.USER_NAME : process.env.USER;
         if (username === envUserName && password === process.env.PASSWORD && process.env.SECRET) {
            // Create the initial admin user from env vars
            const newUser = await User.create({
               email: 'admin@localhost',
               username: envUserName || 'admin',
               password,
               role: 'admin',
               apiKey: User.generateApiKey(),
            });

            const token = jwt.sign(
               {
                  userId: newUser.ID,
                  username: newUser.username,
                  email: newUser.email,
                  role: newUser.role,
               },
               process.env.SECRET,
            );

            const cookies = new Cookies(req, res);
            const expireDate = new Date();
            const sessDuration = process.env.SESSION_DURATION;
            expireDate.setHours((sessDuration && parseInt(sessDuration, 10)) || 24);
            cookies.set('token', token, { httpOnly: true, sameSite: 'lax', maxAge: expireDate.getTime() });

            return res.status(200).json({
               success: true,
               error: null,
               user: {
                  id: newUser.ID,
                  username: newUser.username,
                  email: newUser.email,
                  role: newUser.role,
               },
            });
         }

         const error = username !== envUserName ? 'Incorrect Username' : 'Incorrect Password';
         return res.status(401).json({ success: false, error });
      }

      // Find user by username or email
      const user = await User.findOne({
         where: {
            [Op.or]: [
               { username },
               { email: username },
            ],
         },
      });

      if (!user) {
         return res.status(401).json({ success: false, error: 'User not found' });
      }

      if (!user.isActive) {
         return res.status(401).json({ success: false, error: 'Account is disabled' });
      }

      const isValidPassword = await user.validatePassword(password);

      if (!isValidPassword) {
         return res.status(401).json({ success: false, error: 'Incorrect Password' });
      }

      // Update last login
      await user.update({ lastLogin: new Date() });

      // Create JWT with user info
      const token = jwt.sign(
         {
            userId: user.ID,
            username: user.username,
            email: user.email,
            role: user.role,
         },
         process.env.SECRET as string,
      );

      const cookies = new Cookies(req, res);
      const expireDate = new Date();
      const sessDuration = process.env.SESSION_DURATION;
      expireDate.setHours((sessDuration && parseInt(sessDuration, 10)) || 24);
      cookies.set('token', token, { httpOnly: true, sameSite: 'lax', maxAge: expireDate.getTime() });

      return res.status(200).json({
         success: true,
         error: null,
         user: {
            id: user.ID,
            username: user.username,
            email: user.email,
            role: user.role,
         },
      });
   } catch (error) {
      console.error('[ERROR] Login:', error);
      return res.status(500).json({ success: false, error: 'Internal server error' });
   }
};
