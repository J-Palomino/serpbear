import type { NextApiRequest, NextApiResponse } from 'next';
import Cookies from 'cookies';
import jwt from 'jsonwebtoken';
import User from '../database/models/user';

export type UserRole = 'admin' | 'editor' | 'viewer';

export type AuthenticatedUser = {
   userId: number;
   username: string;
   email: string;
   role: UserRole;
};

export type VerifyResult = {
   authorized: boolean;
   user?: AuthenticatedUser;
   error?: string;
};

/**
 * Verifies the user by their cookie value or their API Key.
 * Returns user info including role for RBAC.
 * @param {NextApiRequest} req - The Next Request
 * @param {NextApiResponse} res - The Next Response.
 * @returns {Promise<VerifyResult>}
 */
export const verifyUserWithRole = async (req: NextApiRequest, res: NextApiResponse): Promise<VerifyResult> => {
   const cookies = new Cookies(req, res);
   const token = cookies && cookies.get('token');

   const allowedApiRoutes = [
      'GET:/api/keyword',
      'GET:/api/keywords',
      'GET:/api/domains',
      'POST:/api/refresh',
      'POST:/api/cron',
      'POST:/api/notify',
      'POST:/api/searchconsole',
      'GET:/api/searchconsole',
      'GET:/api/insight',
   ];

   // Check API key authentication
   const apiKey = req.headers.authorization?.substring('Bearer '.length);
   if (apiKey) {
      try {
         const user = await User.findOne({ where: { apiKey, isActive: true } });
         if (user) {
            const accessingAllowedRoute = req.url && req.method &&
               allowedApiRoutes.includes(`${req.method}:${req.url.replace(/\?(.*)/, '')}`);

            if (accessingAllowedRoute) {
               return {
                  authorized: true,
                  user: {
                     userId: user.ID,
                     username: user.username,
                     email: user.email,
                     role: user.role as UserRole,
                  },
               };
            }
            return { authorized: false, error: 'This Route cannot be accessed with API.' };
         }
         return { authorized: false, error: 'Invalid API Key Provided.' };
      } catch (error) {
         console.log('[ERROR] API key verification:', error);
         return { authorized: false, error: 'Error verifying API key.' };
      }
   }

   // Check JWT token authentication
   if (token && process.env.SECRET) {
      try {
         const decoded = jwt.verify(token, process.env.SECRET) as AuthenticatedUser;

         // Verify user still exists and is active
         const user = await User.findByPk(decoded.userId);
         if (!user || !user.isActive) {
            return { authorized: false, error: 'User account disabled or not found' };
         }

         return {
            authorized: true,
            user: {
               userId: decoded.userId,
               username: decoded.username,
               email: decoded.email,
               role: decoded.role,
            },
         };
      } catch (err) {
         return { authorized: false, error: 'Invalid or expired token' };
      }
   }

   if (!token) {
      return { authorized: false, error: 'Not authorized' };
   }

   if (token && !process.env.SECRET) {
      return { authorized: false, error: 'Token has not been Setup.' };
   }

   return { authorized: false, error: 'Not authorized' };
};

/**
 * Legacy verifyUser function for backward compatibility.
 * Returns 'authorized' string or error message.
 * @param {NextApiRequest} req - The Next Request
 * @param {NextApiResponse} res - The Next Response.
 * @returns {string}
 */
const verifyUser = (req: NextApiRequest, res: NextApiResponse): string => {
   const cookies = new Cookies(req, res);
   const token = cookies && cookies.get('token');

   const allowedApiRoutes = [
      'GET:/api/keyword',
      'GET:/api/keywords',
      'GET:/api/domains',
      'POST:/api/refresh',
      'POST:/api/cron',
      'POST:/api/notify',
      'POST:/api/searchconsole',
      'GET:/api/searchconsole',
      'GET:/api/insight',
   ];
   const verifiedAPI = req.headers.authorization ? req.headers.authorization.substring('Bearer '.length) === process.env.APIKEY : false;
   const accessingAllowedRoute = req.url && req.method && allowedApiRoutes.includes(`${req.method}:${req.url.replace(/\?(.*)/, '')}`);
   console.log(req.method, req.url);

   let authorized: string = '';
   if (token && process.env.SECRET) {
      jwt.verify(token, process.env.SECRET, (err) => {
         authorized = err ? 'Not authorized' : 'authorized';
      });
   } else if (verifiedAPI && accessingAllowedRoute) {
      authorized = 'authorized';
   } else {
      if (!token) {
         authorized = 'Not authorized';
      }
      if (token && !process.env.SECRET) {
         authorized = 'Token has not been Setup.';
      }
      if (verifiedAPI && !accessingAllowedRoute) {
         authorized = 'This Route cannot be accessed with API.';
      }
      if (req.headers.authorization && !verifiedAPI) {
         authorized = 'Invalid API Key Provided.';
      }
   }

   return authorized;
};

export default verifyUser;
