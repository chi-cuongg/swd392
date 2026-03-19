import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE } from '../config';

const ForgotPassword = ({ onBack }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: string }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await axios.post(`${API_BASE}/auth/forgot-password`, { email: email.trim() });
      setMessage({ type: 'success', text: response.data.message || 'Reset link sent! Please check your email (or server console).' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to send reset link' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-900 px-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="glass-card max-w-md w-full p-10 relative z-10 animate-fade-in-up">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white tracking-tight">Reset Password</h2>
          <p className="mt-2 text-sm text-slate-400">
            Enter your email and we'll send you a link to reset your password.
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

          <div>
            <label className="input-label">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              placeholder="admin@spla.io"
            />
          </div>

          <button
            type="submit"
            disabled={loading || (message?.type === 'success')}
            className={`btn-primary w-full py-3 ${loading || (message?.type === 'success') ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={onBack}
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              ← Back to Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
