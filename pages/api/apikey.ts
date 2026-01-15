import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../database/database';
import User from '../../database/models/user';
import { requireAuth } from '../../utils/roleMiddleware';

type ApiKeyResponse = {
   apiKey?: string;
   success?: boolean;
   error?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiKeyResponse>) {
   await db.sync();

   if (req.method === 'GET') {
      return getApiKey(req, res);
   }
   if (req.method === 'POST') {
      return regenerateApiKey(req, res);
   }
   return res.status(405).json({ error: 'Method not allowed' });
}

const getApiKey = async (req: NextApiRequest, res: NextApiResponse<ApiKeyResponse>) => {
   const currentUser = await requireAuth(req, res);
   if (!currentUser) return;

   try {
      const user = await User.findByPk(currentUser.userId, {
         attributes: ['apiKey'],
      });

      if (!user) {
         res.status(404).json({ error: 'User not found' });
         return;
      }

      res.status(200).json({ apiKey: user.apiKey || undefined });
   } catch (error) {
      console.error('[ERROR] Getting API key:', error);
      res.status(500).json({ error: 'Error fetching API key' });
   }
};

const regenerateApiKey = async (req: NextApiRequest, res: NextApiResponse<ApiKeyResponse>) => {
   const currentUser = await requireAuth(req, res);
   if (!currentUser) return;

   try {
      const user = await User.findByPk(currentUser.userId);

      if (!user) {
         res.status(404).json({ error: 'User not found' });
         return;
      }

      const newApiKey = User.generateApiKey();
      await user.update({ apiKey: newApiKey });

      res.status(200).json({ apiKey: newApiKey, success: true });
   } catch (error) {
      console.error('[ERROR] Regenerating API key:', error);
      res.status(500).json({ error: 'Error regenerating API key' });
   }
};
