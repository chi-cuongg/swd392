import React, { useState, useEffect } from 'react';
import { SocketProvider } from './context/SocketContext.jsx';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import DeviceManager from './components/DeviceManager';
import Settings from './components/Settings';
import AdminPanel from './components/AdminPanel';
import AccountSettings from './components/AccountSettings';
import ManageOrganizations from './components/ManageOrganizations';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
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

  const isSystemAdmin = currentUser?.role === 'SYSTEM_ADMIN' || currentUser?.role === 'admin';

  const handleOrganizationChange = (nextOrgId) => {
    if (!isSystemAdmin) return;
    setActiveOrganizationId(nextOrgId);
  };

  useEffect(() => {
    if (!isSystemAdmin && currentView === 'devices') {
      setCurrentView('dashboard');
    }
    if (!isSystemAdmin && currentView === 'admin') {
      setCurrentView('dashboard');
    }
    if (!isSystemAdmin && currentView === 'manage-organizations') {
      setCurrentView('dashboard');
    }
  }, [isSystemAdmin, currentView]);

  const refreshOrganizations = async (preferredOrganizationId) => {
    const orgRes = await axios.get(`${API_BASE}/config/organizations`);
    const orgs = orgRes.data || [];
    setOrganizations(orgs);
    if (orgs.length === 0) {
      setActiveOrganizationId('');
      return;
    }

    if (isSystemAdmin) {
      const preferred = preferredOrganizationId && orgs.find((org) => org.id === preferredOrganizationId);
      const keepCurrent = activeOrganizationId && orgs.find((org) => org.id === activeOrganizationId);
      const chosen = preferred?.id || keepCurrent?.id || orgs[0].id;
      setActiveOrganizationId(chosen);
      return;
    }

    const ownOrg = orgs.find((org) => org.id === currentUser?.organizationId);
    setActiveOrganizationId(ownOrg ? ownOrg.id : orgs[0].id);
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    
    const fetchBootstrap = async () => {
      try {
        await refreshOrganizations();
      } catch (err) {
        // Backend might not be running yet
      }
    };
    fetchBootstrap();
  }, [isAuthenticated, isSystemAdmin, currentUser?.organizationId]);

  useEffect(() => {
    if (!isSystemAdmin && currentUser?.organizationId && activeOrganizationId !== currentUser.organizationId) {
      setActiveOrganizationId(currentUser.organizationId);
    }
  }, [isSystemAdmin, currentUser?.organizationId, activeOrganizationId]);

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
        if (variants.length > 0 && !variants.find(v => v.id === activeVariant)) {
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
    const path = window.location.pathname;
    if (path === '/forgot-password') {
      return <ForgotPassword onBack={() => window.location.href = '/'} />;
    }
    if (path === '/reset-password') {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      return <ResetPassword token={token} onBack={() => window.location.href = '/'} />;
    }
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <SocketProvider organizationId={activeOrganizationId} activeVariant={activeVariant}>
      <div className="flex min-h-screen bg-dark-900 text-slate-100 font-sans">
        <Sidebar
          organizations={organizations}
          activeOrganizationId={activeOrganizationId}
          onOrganizationChange={handleOrganizationChange}
          variants={availableVariants}
          activeVariant={activeVariant}
          onVariantChange={setActiveVariant}
          stats={stats}
          currentView={currentView}
          onViewChange={setCurrentView}
          isSystemAdmin={isSystemAdmin}
          canSwitchOrganization={isSystemAdmin}
          onLogout={handleLogout}
        />
        {currentView === 'dashboard' && <Dashboard activeOrganizationId={activeOrganizationId} activeVariant={activeVariant} />}
        {isSystemAdmin && currentView === 'devices' && <DeviceManager organizationId={activeOrganizationId} domain={activeVariant} />}
        {isSystemAdmin && currentView === 'admin' && (
          <AdminPanel
            organizations={organizations}
            activeOrganizationId={activeOrganizationId}
            onOrganizationChange={handleOrganizationChange}
            currentUser={currentUser}
          />
        )}
        {isSystemAdmin && currentView === 'manage-organizations' && (
          <ManageOrganizations
            organizations={organizations}
            onOrganizationsChanged={refreshOrganizations}
          />
        )}
        {currentView === 'settings' && <Settings organizationId={activeOrganizationId} domain={activeVariant} />}
        {currentView === 'account-settings' && <AccountSettings currentUser={currentUser} />}
      </div>
    </SocketProvider>
  );
}

export default App;
