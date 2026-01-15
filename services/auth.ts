import toast from 'react-hot-toast';
import { useMutation, useQuery, useQueryClient } from 'react-query';

// Fetch current user profile
export async function fetchCurrentUser() {
   const res = await fetch(`${window.location.origin}/api/me`, { method: 'GET' });
   if (res.status === 401) {
      return { user: null };
   }
   return res.json();
}

export function useFetchCurrentUser() {
   return useQuery('currentUser', () => fetchCurrentUser(), {
      retry: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
   });
}

// Update current user profile
export const useUpdateProfile = (onSuccess?: Function) => {
   const queryClient = useQueryClient();

   return useMutation(async (profileData: { email?: string; username?: string; currentPassword?: string; newPassword?: string }) => {
      const headers = new Headers({ 'Content-Type': 'application/json', Accept: 'application/json' });
      const fetchOpts = { method: 'PUT', headers, body: JSON.stringify(profileData) };
      const res = await fetch(`${window.location.origin}/api/me`, fetchOpts);
      const data = await res.json();
      if (res.status >= 400 && res.status < 600) {
         throw new Error(data.error || 'Error updating profile');
      }
      return data;
   }, {
      onSuccess: async () => {
         if (onSuccess) onSuccess();
         toast('Profile Updated!', { icon: '✔️' });
         queryClient.invalidateQueries(['currentUser']);
      },
      onError: (error: Error) => {
         toast(error.message || 'Error Updating Profile.', { icon: '⚠️' });
      },
   });
};

// Fetch current user's API key
export async function fetchApiKey() {
   const res = await fetch(`${window.location.origin}/api/apikey`, { method: 'GET' });
   return res.json();
}

export function useFetchApiKey() {
   return useQuery('apiKey', () => fetchApiKey(), {
      staleTime: 10 * 60 * 1000, // 10 minutes
   });
}

// Regenerate API key
export const useRegenerateApiKey = (onSuccess?: Function) => {
   const queryClient = useQueryClient();

   return useMutation(async () => {
      const res = await fetch(`${window.location.origin}/api/apikey`, { method: 'POST' });
      const data = await res.json();
      if (res.status >= 400 && res.status < 600) {
         throw new Error(data.error || 'Error regenerating API key');
      }
      return data;
   }, {
      onSuccess: async () => {
         if (onSuccess) onSuccess();
         toast('API Key Regenerated!', { icon: '✔️' });
         queryClient.invalidateQueries(['apiKey']);
      },
      onError: (error: Error) => {
         toast(error.message || 'Error Regenerating API Key.', { icon: '⚠️' });
      },
   });
};

// Logout
export async function logout() {
   const res = await fetch(`${window.location.origin}/api/logout`, { method: 'POST' });
   return res.json();
}
