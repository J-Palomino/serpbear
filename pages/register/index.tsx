import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Icon from '../../components/common/Icon';
import { validateInvite, registerWithInvite } from '../../services/invites';

type FormError = {
   type: string,
   msg: string,
}

type InviteData = {
   valid: boolean;
   email: string | null;
   role: string;
}

const Register: NextPage = () => {
   const [error, setError] = useState<FormError | null>(null);
   const [loading, setLoading] = useState<boolean>(true);
   const [inviteData, setInviteData] = useState<InviteData | null>(null);
   const [invalidInvite, setInvalidInvite] = useState<string | null>(null);
   const [email, setEmail] = useState<string>('');
   const [username, setUsername] = useState<string>('');
   const [password, setPassword] = useState<string>('');
   const [confirmPassword, setConfirmPassword] = useState<string>('');
   const router = useRouter();
   const { token } = router.query;

   useEffect(() => {
      if (token && typeof token === 'string') {
         validateInvite(token).then((res) => {
            if (res.valid) {
               setInviteData(res);
               if (res.email) {
                  setEmail(res.email);
               }
            } else {
               setInvalidInvite(res.error || 'Invalid invite');
            }
            setLoading(false);
         }).catch(() => {
            setInvalidInvite('Could not validate invite');
            setLoading(false);
         });
      } else if (router.isReady) {
         setInvalidInvite('No invite token provided');
         setLoading(false);
      }
   }, [token, router.isReady]);

   const handleRegister = async () => {
      let formError: FormError | null = null;

      if (!email || !username || !password || !confirmPassword) {
         formError = { type: 'empty_fields', msg: 'All fields are required' };
      } else if (password !== confirmPassword) {
         formError = { type: 'password_mismatch', msg: 'Passwords do not match' };
      } else if (password.length < 6) {
         formError = { type: 'password_short', msg: 'Password must be at least 6 characters' };
      }

      if (formError) {
         setError(formError);
         setTimeout(() => { setError(null); }, 3000);
         return;
      }

      try {
         setLoading(true);
         const res = await registerWithInvite({
            token: token as string,
            email,
            username,
            password,
         });

         if (res.success) {
            router.push('/');
         } else {
            setError({ type: 'register_error', msg: res.error || 'Registration failed' });
            setTimeout(() => { setError(null); }, 3000);
         }
      } catch (err: any) {
         setError({ type: 'register_error', msg: err.message || 'Registration failed' });
         setTimeout(() => { setError(null); }, 3000);
      } finally {
         setLoading(false);
      }
   };

   const labelStyle = 'mb-2 font-semibold inline-block text-sm text-gray-700';
   const inputStyle = 'w-full p-2 border border-gray-200 rounded mb-3 focus:outline-none focus:border-blue-200';
   const errorBorderStyle = 'border-red-400 focus:border-red-400';

   if (loading) {
      return (
         <div className="Register">
            <Head>
               <title>Register - MintSERP</title>
            </Head>
            <div className="flex items-center justify-center w-full h-screen">
               <div className="text-center">
                  <Icon type="loading" size={30} color="#059669" />
                  <p className="mt-4 text-gray-600">Validating invite...</p>
               </div>
            </div>
         </div>
      );
   }

   if (invalidInvite) {
      return (
         <div className="Register">
            <Head>
               <title>Invalid Invite - MintSERP</title>
            </Head>
            <div className="flex items-center justify-center w-full h-screen">
               <div className="text-center">
                  <h3 className="py-7 text-2xl font-bold text-emerald-700">
                     <span className="relative top-[3px] mr-1">
                        <Icon type="logo" size={30} color="#059669" />
                     </span> MintSERP
                  </h3>
                  <div className="bg-red-100 text-red-600 p-4 rounded-md max-w-md">
                     <p className="font-semibold">{invalidInvite}</p>
                     <p className="mt-2 text-sm">Please contact an administrator for a valid invite link.</p>
                  </div>
               </div>
            </div>
         </div>
      );
   }

   return (
      <div className="Register">
         <Head>
            <title>Register - MintSERP</title>
         </Head>
         <div className="flex items-center justify-center w-full h-screen">
            <div className="w-80 mt-[-200px]">
               <h3 className="py-7 text-2xl font-bold text-emerald-700 text-center">
                  <span className="relative top-[3px] mr-1">
                     <Icon type="logo" size={30} color="#059669" />
                  </span> MintSERP
               </h3>
               <div className="relative bg-[white] rounded-md text-sm border p-5">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4 text-center">Create Your Account</h4>
                  {inviteData?.role && (
                     <p className="text-xs text-gray-500 text-center mb-4">
                        You are being invited as a <span className="font-semibold capitalize">{inviteData.role}</span>
                     </p>
                  )}
                  <div className="settings__section__input mb-3">
                     <label className={labelStyle}>Email</label>
                     <input
                        className={`${inputStyle} ${error && error.type.includes('email') ? errorBorderStyle : ''}`}
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={!!inviteData?.email}
                     />
                  </div>
                  <div className="settings__section__input mb-3">
                     <label className={labelStyle}>Username</label>
                     <input
                        className={`${inputStyle} ${error && error.type.includes('username') ? errorBorderStyle : ''}`}
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                     />
                  </div>
                  <div className="settings__section__input mb-3">
                     <label className={labelStyle}>Password</label>
                     <input
                        className={`${inputStyle} ${error && error.type.includes('password') ? errorBorderStyle : ''}`}
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                     />
                  </div>
                  <div className="settings__section__input mb-5">
                     <label className={labelStyle}>Confirm Password</label>
                     <input
                        className={`${inputStyle} ${error && error.type.includes('password') ? errorBorderStyle : ''}`}
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                     />
                  </div>
                  <button
                     onClick={handleRegister}
                     disabled={loading}
                     className={`py-3 px-5 w-full rounded cursor-pointer bg-emerald-600 hover:bg-emerald-700
                     text-white font-semibold text-sm disabled:opacity-50`}
                  >
                     {loading ? 'Creating Account...' : 'Create Account'}
                  </button>
                  {error && error.msg && (
                     <div className="absolute w-full bottom-[-80px] ml-[-20px] rounded text-center p-3 bg-red-100 text-red-600 text-sm font-semibold">
                        {error.msg}
                     </div>
                  )}
               </div>
            </div>
         </div>
      </div>
   );
};

export default Register;
