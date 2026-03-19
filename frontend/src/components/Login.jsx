import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE } from '../config';

const Login = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [organizations, setOrganizations] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadOrganizations = async () => {
      try {
        const res = await axios.get(`${API_BASE}/auth/organizations`);
        const list = Array.isArray(res.data) ? res.data : [];
        if (!mounted) return;
        setOrganizations(list);
        if (list.length > 0) {
          setSlug((prev) => prev || list[0].slug);
        } else {
          setSlug('home');
        }
      } catch {
        if (!mounted) return;
        setOrganizations([]);
        setSlug('home');
      }
    };

    loadOrganizations();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = mode === 'register' ? 'register' : 'login';
      const payload = {
        organizationSlug: slug.trim(),
        email: email.trim().toLowerCase(),
        password,
        ...(mode === 'register' && name ? { name: name.trim() } : {})
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
    <div className="min-h-screen flex items-center justify-center bg-dark-900 px-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-purple-600/10 rounded-full blur-[80px] pointer-events-none" />
      
      <div className="glass-card max-w-md w-full space-y-8 p-10 relative z-10 animate-fade-in-up">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white flex justify-center items-center gap-3 tracking-tight">
            <span className="text-4xl">📡</span> SPLA <span className="text-blue-500 font-light">Platform</span>
          </h2>
          <p className="mt-3 text-sm text-slate-400 font-medium">
            {mode === 'register' ? 'Create a new account to get started' : 'Sign in to access your IoT Dashboard'}
          </p>
        </div>
        
        <form className="mt-10 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-500 rounded-lg p-3.5 text-sm text-center font-medium animate-fade-scale flex items-center justify-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" /></svg>
              {error}
            </div>
          )}
          
          <div className="space-y-5">
            <div>
              <label className="input-label">
                Organization
              </label>
              {organizations.length > 0 ? (
                <div className="relative">
                  <select
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="form-input appearance-none"
                  >
                    {organizations.map((org) => (
                      <option key={org.id} value={org.slug}>
                        {org.name} ({org.slug})
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
              ) : (
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="form-input"
                  placeholder="Organization slug"
                />
              )}
            </div>

            {mode === 'register' && (
              <div className="animate-fade-in-up" style={{ animationDuration: '0.3s' }}>
                <label className="input-label">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-input"
                  placeholder="Your name"
                />
              </div>
            )}
            
            <div>
              <label className="input-label">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                placeholder="admin@spla.io"
              />
            </div>

            <div>
              <label className="input-label">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input tracking-widest"
                placeholder="••••••••"
              />
            </div>

            {mode === 'login' && (
              <div className="flex justify-end !mt-2">
                <button
                  type="button"
                  onClick={() => window.location.href = '/forgot-password'}
                  className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`btn-primary w-full py-3 text-[15px] mt-8 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? (
                <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    {mode === 'register' ? 'Creating...' : 'Authenticating...'}
                </span>
            ) : (mode === 'register' ? 'Create Account' : 'Sign In')}
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
