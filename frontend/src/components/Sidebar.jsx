import React from 'react';

const VARIANTS = [
    { id: 'home', label: 'Smart Home', icon: '🏠', color: '#3b82f6' },
    { id: 'hospital', label: 'Hospital', icon: '🏥', color: '#ef4444' },
    { id: 'factory', label: 'Factory', icon: '🏭', color: '#f59e0b' },
    { id: 'traffic', label: 'Traffic', icon: '🚗', color: '#10b981' },
    { id: 'farm', label: 'Farm', icon: '🌾', color: '#22c55e' },
];

const Sidebar = ({ activeVariant, onVariantChange, stats }) => {
    return (
        <aside className="w-64 min-h-screen bg-dark-800 border-r border-slate-700/50 flex flex-col">
            {/* Logo */}
            <div className="p-5 border-b border-slate-700/50">
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="text-2xl">📡</span>
                    <div>
                        <div>SMP</div>
                        <div className="text-[10px] text-slate-400 font-normal tracking-widest">SPLA PLATFORM</div>
                    </div>
                </h1>
            </div>

            {/* Variant Selector */}
            <div className="p-4">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-3 font-semibold">Domains</p>
                <nav className="space-y-1">
                    {VARIANTS.map(v => (
                        <button
                            key={v.id}
                            onClick={() => onVariantChange(v.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${activeVariant === v.id
                                    ? 'bg-blue-500/15 text-white border border-blue-500/30'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                                }`}
                        >
                            <span className="text-lg">{v.icon}</span>
                            <span className="font-medium">{v.label}</span>
                        </button>
                    ))}
                </nav>
            </div>

            {/* Stats */}
            <div className="p-4 mt-auto border-t border-slate-700/50">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-3 font-semibold">System</p>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-slate-400">
                        <span>Devices Online</span>
                        <span className="text-green-400 font-semibold">{stats?.onlineDevices ?? 0}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                        <span>Total Logs</span>
                        <span className="text-blue-400 font-semibold">{stats?.totalLogs ?? 0}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                        <span>Alerts</span>
                        <span className="text-red-400 font-semibold">{stats?.criticalAlerts ?? 0}</span>
                    </div>
                </div>
            </div>

            {/* Connection Status */}
            <div className="p-4 border-t border-slate-700/50">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span>Connected to Core</span>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
