import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE } from '../config';

const Login = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('spla'); // Default setup in bootstrap
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = mode === 'register' ? 'register' : 'login';
      const payload = {
        organizationSlug: slug,
        email,
        password,
        ...(mode === 'register' && name ? { name } : {})
      };
      const response = await axios.post(`${API_BASE}/auth/${endpoint}`, payload);

      const { token, user } = response.data;
      
      // Save token and user info
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Configure axios to use token for future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      onLoginSuccess();
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.error || 'Invalid credentials or connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-900 px-4">
      <div className="max-w-md w-full space-y-8 p-8 bg-dark-800 rounded-xl border border-slate-700/50 shadow-2xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white flex justify-center items-center gap-2">
            <span className="text-4xl text-blue-500">📡</span> SPLA Platform
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            {mode === 'register' ? 'Create a new account to get started' : 'Sign in to access your IoT Dashboard'}
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 rounded p-3 text-sm text-center">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Organization Slug (Default: spla)
              </label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                placeholder="Ex: spla"
              />
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="Your name"
                />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                placeholder="admin@spla.io"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white 
              ${loading ? 'bg-blue-600/50 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'}`}
          >
            {loading ? (mode === 'register' ? 'Creating account...' : 'Authenticating...') : (mode === 'register' ? 'Create Account' : 'Sign In')}
          </button>

          <div className="text-center text-sm text-slate-400">
            {mode === 'register' ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'register' ? 'login' : 'register');
                setError('');
              }}
              className="text-blue-400 hover:text-blue-300"
            >
              {mode === 'register' ? 'Sign in' : 'Create one'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
