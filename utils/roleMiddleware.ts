import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyUserWithRole, UserRole, AuthenticatedUser } from './verifyUser';

// Define role permissions
const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
   admin: ['*'], // Full access
   editor: [
      'domains:read', 'domains:create', 'domains:update', 'domains:delete',
      'keywords:read', 'keywords:create', 'keywords:update', 'keywords:delete',
      'settings:read', 'settings:update',
      'refresh:execute',
      'searchconsole:read', 'searchconsole:update',
      'insight:read',
      'ideas:read', 'ideas:create', 'ideas:update',
   ],
   viewer: [
      'domains:read',
      'keywords:read',
      'settings:read',
      'searchconsole:read',
      'insight:read',
      'ideas:read',
   ],
};

/**
 * Check if a role has a specific permission
 */
export const hasPermission = (role: UserRole, permission: string): boolean => {
   const permissions = ROLE_PERMISSIONS[role];
   return permissions.includes('*') || permissions.includes(permission);
};

/**
 * Middleware to require specific roles
 * Returns authenticated user or null (and sends 401/403 response)
 */
export const requireRole = (allowedRoles: UserRole[]) => {
   return async (req: NextApiRequest, res: NextApiResponse): Promise<AuthenticatedUser | null> => {
      const result = await verifyUserWithRole(req, res);

      if (!result.authorized || !result.user) {
         res.status(401).json({ error: result.error || 'Not authorized' });
         return null;
      }

      if (!allowedRoles.includes(result.user.role)) {
         res.status(403).json({ error: 'Insufficient permissions' });
         return null;
      }

      return result.user;
   };
};

/**
 * Middleware to require specific permission
 * Returns authenticated user or null (and sends 401/403 response)
 */
export const requirePermission = (permission: string) => {
   return async (req: NextApiRequest, res: NextApiResponse): Promise<AuthenticatedUser | null> => {
      const result = await verifyUserWithRole(req, res);

      if (!result.authorized || !result.user) {
         res.status(401).json({ error: result.error || 'Not authorized' });
         return null;
      }

      if (!hasPermission(result.user.role, permission)) {
         res.status(403).json({ error: 'Insufficient permissions for this action' });
         return null;
      }

      return result.user;
   };
};

/**
 * Middleware to require authentication without role check
 * Returns authenticated user or null (and sends 401 response)
 */
export const requireAuth = async (req: NextApiRequest, res: NextApiResponse): Promise<AuthenticatedUser | null> => {
   const result = await verifyUserWithRole(req, res);

   if (!result.authorized || !result.user) {
      res.status(401).json({ error: result.error || 'Not authorized' });
      return null;
   }

   return result.user;
};
