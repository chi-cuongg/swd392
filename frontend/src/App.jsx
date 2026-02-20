import React, { useState, useEffect } from 'react';
import { SocketProvider } from './context/SocketContext';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import axios from 'axios';
import './index.css';

const API_BASE = 'http://localhost:3000/api';

function App() {
  const [activeVariant, setActiveVariant] = useState('home');
  const [stats, setStats] = useState(null);

  // Fetch system stats periodically
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get(`${API_BASE}/logs/stats`);
        setStats(res.data);
      } catch (err) {
        // Backend might not be running yet
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <SocketProvider>
      <div className="flex min-h-screen bg-dark-900 text-slate-100 font-sans">
        <Sidebar
          activeVariant={activeVariant}
          onVariantChange={setActiveVariant}
          stats={stats}
        />
        <Dashboard activeVariant={activeVariant} />
      </div>
    </SocketProvider>
  );
}

export default App;
