import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE } from '../../config';

const ChangePassword = () => {
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: string }

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
    setMessage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (!form.currentPassword || !form.newPassword) {
      setMessage({ type: 'error', text: 'Current password and new password are required.' });
      return;
    }

    if (form.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setMessage({ type: 'error', text: 'Password confirmation does not match.' });
      return;
    }

    setSaving(true);
    try {
      await axios.post(`${API_BASE}/auth/reset-password`, {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword
      });
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setMessage({ type: 'success', text: 'Password changed successfully!' });
    } catch (err) {
      console.error('Failed to reset password', err);
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to reset password.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {message && (
        <div
          className={`rounded-lg px-4 py-3 text-sm font-medium ${
            message.type === 'success'
              ? 'bg-green-500/10 border border-green-500/30 text-green-400'
              : 'bg-red-500/10 border border-red-500/30 text-red-400'
          }`}
        >
          {message.text}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">
          Current Password
        </label>
        <input
          type="password"
          value={form.currentPassword}
          onChange={handleChange('currentPassword')}
          className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-colors"
          placeholder="Enter current password"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">
          New Password
        </label>
        <input
          type="password"
          value={form.newPassword}
          onChange={handleChange('newPassword')}
          className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-colors"
          placeholder="At least 6 characters"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">
          Confirm New Password
        </label>
        <input
          type="password"
          value={form.confirmPassword}
          onChange={handleChange('confirmPassword')}
          className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-colors"
          placeholder="Re-enter new password"
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className={`w-full py-2.5 px-4 rounded-lg text-sm font-medium text-white transition-all duration-200 ${
          saving
            ? 'bg-blue-600/50 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-500 active:scale-[0.98] shadow-lg shadow-blue-600/20'
        }`}
      >
        {saving ? 'Updating...' : 'Update Password'}
      </button>
    </form>
  );
};

export default ChangePassword;
