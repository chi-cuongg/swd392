import React, { useState, useEffect } from 'react';
import { SocketProvider } from './context/SocketContext.jsx';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import DeviceManager from './components/DeviceManager';
import Settings from './components/Settings';
import axios from 'axios';
import './index.css';
import { API_BASE } from './config';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [organizations, setOrganizations] = useState([]);
  const [activeOrganizationId, setActiveOrganizationId] = useState('');
  const [availableVariants, setAvailableVariants] = useState([]);
  const [activeVariant, setActiveVariant] = useState('');
  const [stats, setStats] = useState(null);

  // Initialize auth state
  useEffect(() => {
    const token = localStorage.getItem('token');
    const rawUser = localStorage.getItem('user');
    if (rawUser) {
      try {
        setCurrentUser(JSON.parse(rawUser));
      } catch (err) {
        setCurrentUser(null);
      }
    }
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setIsAuthenticated(true);
    }
  }, []);

  const handleLoginSuccess = () => {
    const rawUser = localStorage.getItem('user');
    if (rawUser) {
      try {
        setCurrentUser(JSON.parse(rawUser));
      } catch (err) {
        setCurrentUser(null);
      }
    }
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setIsAuthenticated(false);
    setCurrentUser(null);
    setCurrentView('dashboard');
  };

  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    if (!isAuthenticated) return;
    
    const fetchBootstrap = async () => {
      try {
        const orgRes = await axios.get(`${API_BASE}/config/organizations`);
        const orgs = orgRes.data || [];
        setOrganizations(orgs);
        if (orgs.length > 0) {
          setActiveOrganizationId(orgs[0].id);
        }
      } catch (err) {
        // Backend might not be running yet
      }
    };
    fetchBootstrap();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !activeOrganizationId) return;
    setAvailableVariants([]);
    setActiveVariant('');
    const fetchVariants = async () => {
      try {
        const res = await axios.get(`${API_BASE}/config/variants`, {
          params: { organizationId: activeOrganizationId }
        });
        const variants = res.data || [];
        setAvailableVariants(variants);
        if (variants.length > 0) {
          setActiveVariant(variants[0].id);
        }
      } catch (err) {
        setAvailableVariants([]);
        setActiveVariant('');
        // Ignore bootstrap failures
      }
    };
    fetchVariants();
  }, [isAuthenticated, activeOrganizationId]);

  // Fetch system stats periodically
  useEffect(() => {
    if (!isAuthenticated || !activeOrganizationId) return;
    const fetchStats = async () => {
      try {
        const res = await axios.get(`${API_BASE}/logs/stats`, {
          params: { organizationId: activeOrganizationId }
        });
        setStats(res.data);
      } catch (err) {
        // Backend might not be running yet
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, [isAuthenticated, activeOrganizationId]);

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <SocketProvider organizationId={activeOrganizationId} activeVariant={activeVariant}>
      <div className="flex min-h-screen bg-dark-900 text-slate-100 font-sans">
        <Sidebar
          organizations={organizations}
          activeOrganizationId={activeOrganizationId}
          onOrganizationChange={setActiveOrganizationId}
          variants={availableVariants}
          activeVariant={activeVariant}
          onVariantChange={setActiveVariant}
          stats={stats}
          currentView={currentView}
          onViewChange={setCurrentView}
          isAdmin={isAdmin}
          onLogout={handleLogout}
        />
        {currentView === 'dashboard' && <Dashboard activeOrganizationId={activeOrganizationId} activeVariant={activeVariant} />}
        {isAdmin && currentView === 'devices' && <DeviceManager organizationId={activeOrganizationId} domain={activeVariant} />}
        {currentView === 'settings' && <Settings organizationId={activeOrganizationId} domain={activeVariant} />}
      </div>
    </SocketProvider>
  );
}

export default App;
