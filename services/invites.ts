import toast from 'react-hot-toast';
import { useMutation, useQuery, useQueryClient } from 'react-query';

// Fetch all invites (admin only)
export async function fetchInvites() {
   const res = await fetch(`${window.location.origin}/api/invites`, { method: 'GET' });
   return res.json();
}

export function useFetchInvites() {
   return useQuery('invites', () => fetchInvites());
}

// Create a new invite (admin only)
export const useCreateInvite = (onSuccess?: Function) => {
   const queryClient = useQueryClient();

   return useMutation(async (inviteData: { email?: string; role?: string; expiresInDays?: number }) => {
      const headers = new Headers({ 'Content-Type': 'application/json', Accept: 'application/json' });
      const fetchOpts = { method: 'POST', headers, body: JSON.stringify(inviteData) };
      const res = await fetch(`${window.location.origin}/api/invites`, fetchOpts);
      const data = await res.json();
      if (res.status >= 400 && res.status < 600) {
         throw new Error(data.error || 'Error creating invite');
      }
      return data;
   }, {
      onSuccess: async (data) => {
         if (onSuccess) onSuccess(data);
         toast('Invite Created!', { icon: '✔️' });
         queryClient.invalidateQueries(['invites']);
      },
      onError: (error: Error) => {
         toast(error.message || 'Error Creating Invite.', { icon: '⚠️' });
      },
   });
};

// Delete an invite (admin only)
export const useDeleteInvite = (onSuccess?: Function) => {
   const queryClient = useQueryClient();

   return useMutation(async (id: number) => {
      const res = await fetch(`${window.location.origin}/api/invites?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.status >= 400 && res.status < 600) {
         throw new Error(data.error || 'Error deleting invite');
      }
      return data;
   }, {
      onSuccess: async () => {
         if (onSuccess) onSuccess();
         toast('Invite Deleted!', { icon: '✔️' });
         queryClient.invalidateQueries(['invites']);
      },
      onError: (error: Error) => {
         toast(error.message || 'Error Deleting Invite.', { icon: '⚠️' });
      },
   });
};

// Validate an invite token (public)
export async function validateInvite(token: string) {
   const res = await fetch(`${window.location.origin}/api/register?token=${token}`, { method: 'GET' });
   return res.json();
}

// Register using an invite (public)
export async function registerWithInvite(data: { token: string; email: string; username: string; password: string }) {
   const headers = new Headers({ 'Content-Type': 'application/json', Accept: 'application/json' });
   const fetchOpts = { method: 'POST', headers, body: JSON.stringify(data) };
   const res = await fetch(`${window.location.origin}/api/register`, fetchOpts);
   const responseData = await res.json();
   if (res.status >= 400 && res.status < 600) {
      throw new Error(responseData.error || 'Error registering');
   }
   return responseData;
}
