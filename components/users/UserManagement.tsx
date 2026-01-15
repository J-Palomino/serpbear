import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { useFetchUsers, useUpdateUser, useDeleteUser } from '../../services/users';
import { useFetchInvites, useCreateInvite, useDeleteInvite } from '../../services/invites';
import Icon from '../common/Icon';
import useOnKey from '../../hooks/useOnKey';

type UserManagementProps = {
   closePanel: Function,
}

const getRoleBadgeStyle = (role: string): string => {
   if (role === 'admin') return 'bg-purple-100 text-purple-700';
   if (role === 'editor') return 'bg-blue-100 text-blue-700';
   return 'bg-gray-100 text-gray-700';
};

const UserManagement = ({ closePanel }: UserManagementProps) => {
   const [currentTab, setCurrentTab] = useState<string>('users');
   const [showCreateInvite, setShowCreateInvite] = useState<boolean>(false);
   const [inviteEmail, setInviteEmail] = useState<string>('');
   const [inviteRole, setInviteRole] = useState<string>('viewer');
   const [inviteExpiry, setInviteExpiry] = useState<number>(7);
   const [copiedInvite, setCopiedInvite] = useState<string | null>(null);

   const { data: usersData, isLoading: usersLoading } = useFetchUsers();
   const { data: invitesData, isLoading: invitesLoading } = useFetchInvites();
   const { mutate: updateUser } = useUpdateUser();
   const { mutate: deleteUser } = useDeleteUser();
   const { mutate: createInvite } = useCreateInvite((data: any) => {
      setShowCreateInvite(false);
      setInviteEmail('');
      setInviteRole('viewer');
      if (data?.invite?.inviteUrl) {
         navigator.clipboard.writeText(data.invite.inviteUrl);
         setCopiedInvite(data.invite.token);
         setTimeout(() => setCopiedInvite(null), 3000);
      }
   });
   const { mutate: deleteInvite } = useDeleteInvite();

   useOnKey('Escape', closePanel);

   const closeOnBGClick = (e: React.SyntheticEvent) => {
      e.stopPropagation();
      if (e.target === e.currentTarget) { closePanel(); }
   };

   const handleCreateInvite = () => {
      createInvite({
         email: inviteEmail || undefined,
         role: inviteRole,
         expiresInDays: inviteExpiry,
      });
   };

   const copyInviteUrl = (invite: any) => {
      const baseUrl = window.location.origin;
      const inviteUrl = `${baseUrl}/register?token=${invite.token}`;
      navigator.clipboard.writeText(inviteUrl);
      setCopiedInvite(invite.token);
      setTimeout(() => setCopiedInvite(null), 3000);
   };

   const handleDeleteUser = (userId: number) => {
      // eslint-disable-next-line no-alert
      if (window.confirm('Are you sure you want to delete this user?')) {
         deleteUser(userId);
      }
   };

   const handleDeleteInvite = (inviteId: number) => {
      // eslint-disable-next-line no-alert
      if (window.confirm('Are you sure you want to delete this invite?')) {
         deleteInvite(inviteId);
      }
   };

   const tabStyle = `inline-block px-3 py-2 rounded-md cursor-pointer text-xs lg:text-sm lg:mr-3 lg:px-4 select-none z-10
   text-gray-600 border border-b-0 relative top-[1px] rounded-b-none`;
   const tabStyleActive = 'bg-white text-blue-600 border-slate-200';

   const isLoading = usersLoading || invitesLoading;

   return (
      <div className="users-panel fixed w-full h-screen top-0 left-0 z-50" onClick={closeOnBGClick}>
         <Toaster position='bottom-center' containerClassName='lg:ml-[-250px] toast' />
         <div className="absolute w-full max-w-2xl bg-white customShadow top-0 right-0 h-screen" data-loading={isLoading}>
            <div className="settings__header flex items-center justify-between border-b border-b-slate-200 px-5 py-3">
               <h3 className="text-lg font-bold text-slate-700">User Management</h3>
               <button
                  className="p-1 rounded hover:bg-gray-100"
                  onClick={() => closePanel()}
               >
                  <Icon type="close" color="#666" size={18} />
               </button>
            </div>

            <div className="px-5 py-3 bg-slate-50 border-b border-slate-200">
               <span
                  className={`${tabStyle} ${currentTab === 'users' ? tabStyleActive : ''}`}
                  onClick={() => setCurrentTab('users')}
               >
                  Users
               </span>
               <span
                  className={`${tabStyle} ${currentTab === 'invites' ? tabStyleActive : ''}`}
                  onClick={() => setCurrentTab('invites')}
               >
                  Invites
               </span>
            </div>

            <div className="overflow-y-auto h-[calc(100vh-130px)] px-5 py-4">
               {currentTab === 'users' && (
                  <div className="users-list">
                     <h4 className="text-sm font-semibold text-gray-700 mb-3">
                        Team Members ({usersData?.users?.length || 0})
                     </h4>
                     {usersData?.users?.map((user: any) => (
                        <div
                           key={user.ID}
                           className="bg-white border border-gray-200 rounded-md p-4 mb-3"
                        >
                           <div className="flex items-center justify-between">
                              <div>
                                 <h5 className="font-semibold text-gray-800">{user.username}</h5>
                                 <p className="text-sm text-gray-500">{user.email}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                 <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${getRoleBadgeStyle(user.role)}`}>
                                    {user.role}
                                 </span>
                                 {!user.isActive && (
                                    <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700">
                                       Disabled
                                    </span>
                                 )}
                              </div>
                           </div>
                           <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                              <div className="text-xs text-gray-400">
                                 {user.lastLogin
                                    ? `Last login: ${new Date(user.lastLogin).toLocaleDateString()}`
                                    : 'Never logged in'}
                              </div>
                              <div className="flex gap-2">
                                 <select
                                    className="text-xs border rounded px-2 py-1"
                                    value={user.role}
                                    onChange={(e) => updateUser({ id: user.ID, role: e.target.value })}
                                 >
                                    <option value="admin">Admin</option>
                                    <option value="editor">Editor</option>
                                    <option value="viewer">Viewer</option>
                                 </select>
                                 <button
                                    className={`px-2 py-1 rounded text-xs ${
                                       user.isActive
                                          ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                                    }`}
                                    onClick={() => updateUser({ id: user.ID, isActive: !user.isActive })}
                                 >
                                    {user.isActive ? 'Disable' : 'Enable'}
                                 </button>
                                 <button
                                    className="px-2 py-1 rounded text-xs bg-red-100 text-red-700 hover:bg-red-200"
                                    onClick={() => handleDeleteUser(user.ID)}
                                 >
                                    Delete
                                 </button>
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>
               )}

               {currentTab === 'invites' && (
                  <div className="invites-list">
                     <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-gray-700">
                           Pending Invites ({invitesData?.invites?.filter((i: any) => i.isValid).length || 0})
                        </h4>
                        <button
                           className="px-3 py-1 rounded text-xs bg-emerald-600 text-white hover:bg-emerald-700"
                           onClick={() => setShowCreateInvite(true)}
                        >
                           + Create Invite
                        </button>
                     </div>

                     {showCreateInvite && (
                        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                           <h5 className="font-semibold text-gray-800 mb-3">Create New Invite</h5>
                           <div className="grid grid-cols-2 gap-3 mb-3">
                              <div>
                                 <label className="block text-xs text-gray-600 mb-1">Email (optional)</label>
                                 <input
                                    type="email"
                                    className="w-full p-2 border rounded text-sm"
                                    placeholder="user@example.com"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                 />
                              </div>
                              <div>
                                 <label className="block text-xs text-gray-600 mb-1">Role</label>
                                 <select
                                    className="w-full p-2 border rounded text-sm"
                                    value={inviteRole}
                                    onChange={(e) => setInviteRole(e.target.value)}
                                 >
                                    <option value="viewer">Viewer</option>
                                    <option value="editor">Editor</option>
                                    <option value="admin">Admin</option>
                                 </select>
                              </div>
                           </div>
                           <div className="mb-3">
                              <label className="block text-xs text-gray-600 mb-1">Expires in (days)</label>
                              <select
                                 className="w-full p-2 border rounded text-sm"
                                 value={inviteExpiry}
                                 onChange={(e) => setInviteExpiry(Number(e.target.value))}
                              >
                                 <option value={1}>1 day</option>
                                 <option value={3}>3 days</option>
                                 <option value={7}>7 days</option>
                                 <option value={14}>14 days</option>
                                 <option value={30}>30 days</option>
                              </select>
                           </div>
                           <div className="flex gap-2">
                              <button
                                 className="px-4 py-2 rounded text-sm bg-emerald-600 text-white hover:bg-emerald-700"
                                 onClick={handleCreateInvite}
                              >
                                 Create Invite
                              </button>
                              <button
                                 className="px-4 py-2 rounded text-sm bg-gray-200 text-gray-700 hover:bg-gray-300"
                                 onClick={() => setShowCreateInvite(false)}
                              >
                                 Cancel
                              </button>
                           </div>
                        </div>
                     )}

                     {invitesData?.invites?.map((invite: any) => (
                        <div
                           key={invite.ID}
                           className={`bg-white border rounded-md p-4 mb-3 ${
                              !invite.isValid ? 'border-gray-200 opacity-60' : 'border-gray-200'
                           }`}
                        >
                           <div className="flex items-center justify-between">
                              <div>
                                 <p className="font-mono text-sm text-gray-600">
                                    {invite.token.substring(0, 16)}...
                                 </p>
                                 {invite.email && (
                                    <p className="text-xs text-gray-500">For: {invite.email}</p>
                                 )}
                              </div>
                              <div className="flex items-center gap-2">
                                 <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${getRoleBadgeStyle(invite.role)}`}>
                                    {invite.role}
                                 </span>
                                 {invite.used && (
                                    <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">
                                       Used
                                    </span>
                                 )}
                                 {invite.isExpired && !invite.used && (
                                    <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700">
                                       Expired
                                    </span>
                                 )}
                              </div>
                           </div>
                           <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                              <div className="text-xs text-gray-400">
                                 Expires: {new Date(invite.expiresAt).toLocaleDateString()}
                                 {invite.creator && ` | Created by: ${invite.creator.username}`}
                              </div>
                              <div className="flex gap-2">
                                 {invite.isValid && (
                                    <button
                                       className={`px-2 py-1 rounded text-xs ${
                                          copiedInvite === invite.token
                                             ? 'bg-green-100 text-green-700'
                                             : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                       }`}
                                       onClick={() => copyInviteUrl(invite)}
                                    >
                                       {copiedInvite === invite.token ? 'Copied!' : 'Copy Link'}
                                    </button>
                                 )}
                                 <button
                                    className="px-2 py-1 rounded text-xs bg-red-100 text-red-700 hover:bg-red-200"
                                    onClick={() => handleDeleteInvite(invite.ID)}
                                 >
                                    Delete
                                 </button>
                              </div>
                           </div>
                        </div>
                     ))}

                     {(!invitesData?.invites || invitesData.invites.length === 0) && (
                        <div className="text-center py-8 text-gray-500">
                           <p>No invites yet.</p>
                           <p className="text-sm mt-1">Create an invite to add team members.</p>
                        </div>
                     )}
                  </div>
               )}
            </div>
         </div>
      </div>
   );
};

export default UserManagement;
