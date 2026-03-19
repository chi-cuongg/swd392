import React from 'react';
import ChangePassword from './account/ChangePassword';

const AccountSettings = ({ currentUser }) => {
  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Account Settings</h1>
        <p className="text-slate-400 text-sm">Manage your profile and security settings.</p>
      </div>

      <div className="max-w-xl mx-auto space-y-6">
        {/* Profile Info */}
        <div className="bg-dark-800 border border-slate-700/50 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span>👤</span> Profile Info
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-slate-700/30">
              <span className="text-sm text-slate-400">Email</span>
              <span className="text-sm text-white font-medium">{currentUser?.email || '—'}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-700/30">
              <span className="text-sm text-slate-400">Name</span>
              <span className="text-sm text-white font-medium">{currentUser?.name || '—'}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-slate-400">Role</span>
              <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">
                {currentUser?.role || '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-dark-800 border border-slate-700/50 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span>🔐</span> Change Password
          </h2>
          <ChangePassword />
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;
