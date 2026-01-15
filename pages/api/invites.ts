import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../database/database';
import Invite from '../../database/models/invite';
import User from '../../database/models/user';
import { requireRole } from '../../utils/roleMiddleware';

type InvitesResponse = {
   invites?: any[];
   invite?: any;
   success?: boolean;
   error?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<InvitesResponse>) {
   await db.sync();

   if (req.method === 'GET') {
      return getInvites(req, res);
   }
   if (req.method === 'POST') {
      return createInvite(req, res);
   }
   if (req.method === 'DELETE') {
      return deleteInvite(req, res);
   }
   return res.status(405).json({ error: 'Method not allowed' });
}

const getInvites = async (req: NextApiRequest, res: NextApiResponse<InvitesResponse>) => {
   const user = await requireRole(['admin'])(req, res);
   if (!user) return;

   try {
      const invites = await Invite.findAll({
         include: [{ model: User, as: 'creator', attributes: ['username'] }],
         order: [['createdAt', 'DESC']],
      });

      const formattedInvites = invites.map((invite) => {
         const plain = invite.get({ plain: true });
         return {
            ...plain,
            isExpired: invite.isExpired(),
            isValid: invite.isValid(),
         };
      });

      res.status(200).json({ invites: formattedInvites });
   } catch (error) {
      console.error('[ERROR] Getting invites:', error);
      res.status(500).json({ error: 'Error fetching invites' });
   }
};

const createInvite = async (req: NextApiRequest, res: NextApiResponse<InvitesResponse>) => {
   const user = await requireRole(['admin'])(req, res);
   if (!user) return;

   const { email, role, expiresInDays = 7 } = req.body;

   // Validate role
   const validRoles = ['admin', 'editor', 'viewer'];
   if (role && !validRoles.includes(role)) {
      res.status(400).json({ error: 'Invalid role. Must be admin, editor, or viewer' });
      return;
   }

   try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);

      const invite = await Invite.create({
         token: Invite.generateToken(),
         email: email || null,
         role: role || 'viewer',
         createdBy: user.userId,
         expiresAt,
      });

      // Generate invite URL
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${req.headers.host}`;
      const inviteUrl = `${baseUrl}/register?token=${invite.token}`;

      res.status(201).json({
         invite: {
            ID: invite.ID,
            token: invite.token,
            email: invite.email,
            role: invite.role,
            expiresAt: invite.expiresAt,
            inviteUrl,
         },
      });
   } catch (error) {
      console.error('[ERROR] Creating invite:', error);
      res.status(500).json({ error: 'Error creating invite' });
   }
};

const deleteInvite = async (req: NextApiRequest, res: NextApiResponse<InvitesResponse>) => {
   const user = await requireRole(['admin'])(req, res);
   if (!user) return;

   const { id } = req.query;

   if (!id) {
      res.status(400).json({ error: 'Invite ID is required' });
      return;
   }

   try {
      const invite = await Invite.findByPk(Number(id));
      if (!invite) {
         res.status(404).json({ error: 'Invite not found' });
         return;
      }

      await invite.destroy();
      res.status(200).json({ success: true });
   } catch (error) {
      console.error('[ERROR] Deleting invite:', error);
      res.status(500).json({ error: 'Error deleting invite' });
   }
};
