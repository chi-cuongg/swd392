import React from 'react';
import ChangePassword from './account/ChangePassword';

const AccountSettings = ({ currentUser }) => {
  return (
    <div className="flex-1 overflow-y-auto p-8 max-w-7xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="page-title">Account Settings</h1>
        <p className="text-slate-400 text-sm">Manage your profile and security settings.</p>
      </div>

      <div className="max-w-xl mx-auto space-y-8">
        {/* Profile Info */}
        <div className="glass-card p-8 border-slate-700/50">
          <h2 className="section-title mb-6 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-blue-400">
              <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
            </svg>
            Profile Info
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-slate-700/30">
              <span className="text-sm font-medium text-slate-400">Email</span>
              <span className="text-sm text-white font-medium">{currentUser?.email || '—'}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-slate-700/30">
              <span className="text-sm font-medium text-slate-400">Name</span>
              <span className="text-sm text-white font-medium">{currentUser?.name || '—'}</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-sm font-medium text-slate-400">Role</span>
              <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${currentUser?.role === 'SYSTEM_ADMIN' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' : 'bg-blue-500/10 text-blue-400 border-blue-500/30'}`}>
                {currentUser?.role || '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="glass-card p-8 border-slate-700/50">
          <h2 className="section-title mb-6 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-blue-400">
              <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
            </svg>
            Change Password
          </h2>
          <ChangePassword />
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;
