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
  const [currentView, setCurrentView] = useState('dashboard');
  const [organizations, setOrganizations] = useState([]);
  const [activeOrganizationId, setActiveOrganizationId] = useState('');
  const [availableVariants, setAvailableVariants] = useState([]);
  const [activeVariant, setActiveVariant] = useState('home');
  const [stats, setStats] = useState(null);

  // Initialize auth state
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setIsAuthenticated(true);
    }
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setIsAuthenticated(false);
    setCurrentView('dashboard');
  };

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
    const fetchVariants = async () => {
      try {
        const res = await axios.get(`${API_BASE}/config/variants`, {
          params: { organizationId: activeOrganizationId }
        });
        const variants = res.data || [];
        setAvailableVariants(variants);
        if (variants.length > 0 && !variants.find(v => v.id === activeVariant)) {
          setActiveVariant(variants[0].id);
        }
      } catch (err) {
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
          onLogout={handleLogout}
        />
        {currentView === 'dashboard' && <Dashboard activeOrganizationId={activeOrganizationId} activeVariant={activeVariant} />}
        {currentView === 'devices' && <DeviceManager organizationId={activeOrganizationId} domain={activeVariant} />}
        {currentView === 'settings' && <Settings organizationId={activeOrganizationId} domain={activeVariant} />}
      </div>
    </SocketProvider>
  );
}

export default App;
