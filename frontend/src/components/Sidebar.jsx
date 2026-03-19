import React from 'react';

const Sidebar = ({
    organizations,
    activeOrganizationId,
    onOrganizationChange,
    variants,
    activeVariant,
    onVariantChange,
    stats,
    currentView,
    onViewChange,
    isSystemAdmin,
    canSwitchOrganization,
    onLogout
}) => {
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

            <div className="p-4 border-b border-slate-700/50">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 font-semibold">Organization</p>
                <select
                    value={activeOrganizationId}
                    onChange={(e) => onOrganizationChange(e.target.value)}
                    disabled={!canSwitchOrganization}
                    className="w-full rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-sm px-3 py-2"
                >
                    {organizations.map((org) => (
                        <option key={org.id} value={org.id}>{org.name}</option>
                    ))}
                </select>
            </div>

            {/* Variant Selector */}
            <div className="p-4">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-3 font-semibold">Domains</p>
                <nav className="space-y-1">
                    {variants.map(v => (
                        <button
                            key={v.id}
                            onClick={() => onVariantChange(v.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${activeVariant === v.id
                                    ? 'bg-blue-500/15 text-white border border-blue-500/30'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                                }`}
                        >
                            <span className="text-lg">•</span>
                            <span className="font-medium">{v.label}</span>
                        </button>
                    ))}
                </nav>
            </div>

            {/* Application Views Menu */}
            <div className="p-4 border-t border-slate-700/50">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-3 font-semibold">Menu</p>
                <nav className="space-y-1">
                    <button
                        onClick={() => onViewChange('dashboard')}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${currentView === 'dashboard'
                                ? 'bg-blue-500/15 text-white border border-blue-500/30'
                                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                            }`}
                    >
                        <span>📊</span>
                        <span className="font-medium">Dashboard</span>
                    </button>
                    {isSystemAdmin && (
                        <button
                            onClick={() => onViewChange('devices')}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${currentView === 'devices'
                                    ? 'bg-blue-500/15 text-white border border-blue-500/30'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                                }`}
                        >
                            <span>🎛️</span>
                            <span className="font-medium">Manage Devices</span>
                        </button>
                    )}
                    {isSystemAdmin && (
                        <button
                            onClick={() => onViewChange('manage-organizations')}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${currentView === 'manage-organizations'
                                    ? 'bg-blue-500/15 text-white border border-blue-500/30'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                                }`}
                        >
                            <span>🏢</span>
                            <span className="font-medium">Manage Organizations</span>
                        </button>
                    )}
                    {isSystemAdmin && (
                        <button
                            onClick={() => onViewChange('admin')}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${currentView === 'admin'
                                    ? 'bg-blue-500/15 text-white border border-blue-500/30'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                                }`}
                        >
                            <span>👤</span>
                            <span className="font-medium">Manage Users</span>
                        </button>
                    )}
                    <button
                        onClick={() => onViewChange('settings')}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${currentView === 'settings'
                                ? 'bg-blue-500/15 text-white border border-blue-500/30'
                                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                            }`}
                    >
                        <span>⚙️</span>
                        <span className="font-medium">Configure Thresholds</span>
                    </button>
                    <button
                        onClick={() => onViewChange('account-settings')}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${currentView === 'account-settings'
                                ? 'bg-blue-500/15 text-white border border-blue-500/30'
                                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                            }`}
                    >
                        <span>🔐</span>
                        <span className="font-medium">Account Settings</span>
                    </button>
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

            {/* Connection Status & Logout */}
            <div className="p-4 border-t border-slate-700/50 flex justify-between items-center">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span>Connected to Core</span>
                </div>
                <button 
                    onClick={onLogout}
                    className="text-xs text-red-400 hover:text-red-300 hover:bg-red-400/10 px-2 py-1 rounded transition-colors"
                >
                    Logout
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
