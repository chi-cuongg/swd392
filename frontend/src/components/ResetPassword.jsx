import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE } from '../config';

const ResetPassword = ({ token, onBack }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }
    if (password.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      await axios.post(`${API_BASE}/auth/reset-password-with-token`, {
        token,
        newPassword: password
      });
      setMessage({ type: 'success', text: 'Password reset successful! You can now log in.' });
      setTimeout(() => onBack(), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to reset password' });
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-900 px-4">
        <div className="glass-card max-w-md w-full p-10 text-center space-y-4">
          <div className="text-red-500 text-4xl">⚠️</div>
          <h2 className="text-xl font-bold text-white">Invalid Link</h2>
          <p className="text-slate-400 text-sm">This password reset link is invalid or has expired.</p>
          <button onClick={onBack} className="text-blue-400 hover:text-blue-300 text-sm font-medium pt-4">Return to Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-900 px-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="glass-card max-w-md w-full p-10 relative z-10 animate-fade-in-up">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white tracking-tight">New Password</h2>
          <p className="mt-2 text-sm text-slate-400">
            Set a new password for your account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {message && (
            <div className={`p-4 rounded-lg text-sm text-center font-medium animate-fade-scale ${
              message.type === 'success' ? 'bg-green-500/10 border border-green-500/30 text-green-400' : 'bg-red-500/10 border border-red-500/30 text-red-500'
            }`}>
              {message.text}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="input-label">New Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input tracking-widest"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="input-label">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="form-input tracking-widest"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || (message?.type === 'success')}
            className={`btn-primary w-full py-3 ${loading || (message?.type === 'success') ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Resetting...' : 'Update Password'}
          </button>

          {message?.type !== 'success' && (
            <div className="text-center">
              <button
                type="button"
                onClick={onBack}
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
