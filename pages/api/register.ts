import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import Cookies from 'cookies';
import { Op } from 'sequelize';
import db from '../../database/database';
import User from '../../database/models/user';
import Invite from '../../database/models/invite';

type RegisterResponse = {
   success?: boolean;
   valid?: boolean;
   email?: string | null;
   role?: string;
   user?: {
      id: number;
      email: string;
      username: string;
      role: string;
   };
   error?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<RegisterResponse>) {
   await db.sync();

   if (req.method === 'GET') {
      return validateInvite(req, res);
   }
   if (req.method === 'POST') {
      return registerUser(req, res);
   }
   return res.status(405).json({ error: 'Method not allowed' });
}

const validateInvite = async (req: NextApiRequest, res: NextApiResponse<RegisterResponse>) => {
   const { token } = req.query;

   if (!token) {
      return res.status(400).json({ error: 'Invite token is required' });
   }

   try {
      const invite = await Invite.findOne({ where: { token } });

      if (!invite) {
         return res.status(404).json({ error: 'Invalid invite token' });
      }

      if (!invite.isValid()) {
         if (invite.used) {
            return res.status(400).json({ error: 'This invite has already been used' });
         }
         return res.status(400).json({ error: 'This invite has expired' });
      }

      return res.status(200).json({
         valid: true,
         email: invite.email,
         role: invite.role,
      });
   } catch (error) {
      console.error('[ERROR] Validating invite:', error);
      return res.status(500).json({ error: 'Error validating invite' });
   }
};

const registerUser = async (req: NextApiRequest, res: NextApiResponse<RegisterResponse>) => {
   const { token, email, username, password } = req.body;

   if (!token || !email || !username || !password) {
      return res.status(400).json({ error: 'All fields are required' });
   }

   if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
   }

   try {
      const invite = await Invite.findOne({ where: { token } });

      if (!invite || !invite.isValid()) {
         return res.status(400).json({ error: 'Invalid or expired invite' });
      }

      // If invite has specific email, verify it matches
      if (invite.email && invite.email.toLowerCase() !== email.toLowerCase()) {
         return res.status(400).json({ error: 'Email does not match the invite' });
      }

      // Check for existing user
      const existingUser = await User.findOne({
         where: {
            [Op.or]: [{ email }, { username }],
         },
      });

      if (existingUser) {
         if (existingUser.email === email) {
            return res.status(400).json({ error: 'Email already registered' });
         }
         return res.status(400).json({ error: 'Username already taken' });
      }

      // Create user
      const newUser = await User.create({
         email,
         username,
         password,
         role: invite.role,
         apiKey: User.generateApiKey(),
      });

      // Mark invite as used
      await invite.update({
         used: true,
         usedBy: newUser.ID,
         usedAt: new Date(),
      });

      // Auto-login the new user
      const jwtToken = jwt.sign(
         {
            userId: newUser.ID,
            username: newUser.username,
            email: newUser.email,
            role: newUser.role,
         },
         process.env.SECRET as string,
      );

      const cookies = new Cookies(req, res);
      const expireDate = new Date();
      expireDate.setHours(24);
      cookies.set('token', jwtToken, { httpOnly: true, sameSite: 'lax', maxAge: expireDate.getTime() });

      return res.status(201).json({
         success: true,
         user: {
            id: newUser.ID,
            email: newUser.email,
            username: newUser.username,
            role: newUser.role,
         },
      });
   } catch (error) {
      console.error('[ERROR] Registering user:', error);
      return res.status(500).json({ error: 'Error creating account' });
   }
};
