import toast from 'react-hot-toast';
import { useMutation, useQuery, useQueryClient } from 'react-query';

// Fetch all users (admin only)
export async function fetchUsers() {
   const res = await fetch(`${window.location.origin}/api/users`, { method: 'GET' });
   return res.json();
}

export function useFetchUsers() {
   return useQuery('users', () => fetchUsers());
}

// Create a new user (admin only)
export const useCreateUser = (onSuccess?: Function) => {
   const queryClient = useQueryClient();

   return useMutation(async (userData: { email: string; username: string; password: string; role?: string }) => {
      const headers = new Headers({ 'Content-Type': 'application/json', Accept: 'application/json' });
      const fetchOpts = { method: 'POST', headers, body: JSON.stringify(userData) };
      const res = await fetch(`${window.location.origin}/api/users`, fetchOpts);
      const data = await res.json();
      if (res.status >= 400 && res.status < 600) {
         throw new Error(data.error || 'Error creating user');
      }
      return data;
   }, {
      onSuccess: async () => {
         if (onSuccess) onSuccess();
         toast('User Created!', { icon: '✔️' });
         queryClient.invalidateQueries(['users']);
      },
      onError: (error: Error) => {
         toast(error.message || 'Error Creating User.', { icon: '⚠️' });
      },
   });
};

// Update a user (admin only)
export const useUpdateUser = (onSuccess?: Function) => {
   const queryClient = useQueryClient();

   return useMutation(async ({ id, ...userData }: { id: number; email?: string; username?: string; password?: string; role?: string; isActive?: boolean }) => {
      const headers = new Headers({ 'Content-Type': 'application/json', Accept: 'application/json' });
      const fetchOpts = { method: 'PUT', headers, body: JSON.stringify(userData) };
      const res = await fetch(`${window.location.origin}/api/users?id=${id}`, fetchOpts);
      const data = await res.json();
      if (res.status >= 400 && res.status < 600) {
         throw new Error(data.error || 'Error updating user');
      }
      return data;
   }, {
      onSuccess: async () => {
         if (onSuccess) onSuccess();
         toast('User Updated!', { icon: '✔️' });
         queryClient.invalidateQueries(['users']);
      },
      onError: (error: Error) => {
         toast(error.message || 'Error Updating User.', { icon: '⚠️' });
      },
   });
};

// Delete a user (admin only)
export const useDeleteUser = (onSuccess?: Function) => {
   const queryClient = useQueryClient();

   return useMutation(async (id: number) => {
      const res = await fetch(`${window.location.origin}/api/users?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.status >= 400 && res.status < 600) {
         throw new Error(data.error || 'Error deleting user');
      }
      return data;
   }, {
      onSuccess: async () => {
         if (onSuccess) onSuccess();
         toast('User Deleted!', { icon: '✔️' });
         queryClient.invalidateQueries(['users']);
      },
      onError: (error: Error) => {
         toast(error.message || 'Error Deleting User.', { icon: '⚠️' });
      },
   });
};
