import React, { useState } from 'react';

const Icon = ({ path, className = "w-5 h-5", fill = "none" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill={fill} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
);

const ICONS = {
    dashboard: "M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z",
    devices: "M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25z",
    organizations: "M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z",
    users: "M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z",
    settings: "M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75",
    account: "M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z",
    logout: "M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75",
    chevronLeft: "M15.75 19.5L8.25 12l7.5-7.5",
    chevronRight: "M8.25 4.5l7.5 7.5-7.5 7.5",
    domain: "M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.974 0-5.749-.534-8.243-1.5M10.5 2.25v2.25",
    logo: "M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z"
};

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
    const [collapsed, setCollapsed] = useState(false);

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: ICONS.dashboard },
        ...(isSystemAdmin ? [{ id: 'devices', label: 'Manage Devices', icon: ICONS.devices }] : []),
        ...(isSystemAdmin ? [{ id: 'manage-organizations', label: 'Manage Organizations', icon: ICONS.organizations }] : []),
        ...(isSystemAdmin ? [{ id: 'admin', label: 'Manage Users', icon: ICONS.users }] : []),
        { id: 'settings', label: 'Configure Thresholds', icon: ICONS.settings },
        { id: 'account-settings', label: 'Account Settings', icon: ICONS.account },
    ];

    return (
        <aside className={`relative flex flex-col min-h-screen bg-[#0a0f1c] border-r border-slate-700/40 transition-all duration-300 z-40 ${collapsed ? 'w-20' : 'w-64'}`}>
            {/* Collapse Toggle */}
            <button 
                onClick={() => setCollapsed(!collapsed)}
                className="absolute -right-3 top-6 bg-[#1a233a] border border-slate-600 rounded-full p-1 text-slate-400 hover:text-white hover:border-blue-500 transition-colors z-50 shadow-md"
            >
                <Icon path={collapsed ? ICONS.chevronRight : ICONS.chevronLeft} className="w-4 h-4" />
            </button>

            {/* Logo */}
            <div className="p-5 border-b border-slate-800/80">
                <h1 className="text-xl font-bold text-white flex items-center gap-3">
                    <div className="text-blue-500 bg-blue-500/10 p-1.5 rounded-lg border border-blue-500/20">
                        <Icon path={ICONS.logo} className="w-6 h-6" />
                    </div>
                    {!collapsed && (
                        <div className="animate-fade-scale origin-left">
                            <div className="leading-tight">SMP</div>
                            <div className="text-[10px] text-slate-400 font-normal tracking-widest">SPLA PLATFORM</div>
                        </div>
                    )}
                </h1>
            </div>

            {/* Selectors */}
            <div className={`p-4 border-b border-slate-800/80 ${collapsed ? 'hidden' : 'block'}`}>
                <p className="text-xs text-slate-500 uppercase tracking-widest mb-2 font-semibold">Organization</p>
                <select
                    value={activeOrganizationId}
                    onChange={(e) => onOrganizationChange(e.target.value)}
                    disabled={!canSwitchOrganization}
                    className="w-full form-input"
                >
                    {organizations.map((org) => (
                        <option key={org.id} value={org.id}>{org.name}</option>
                    ))}
                </select>
            </div>

            {/* Domains */}
            <div className="p-4">
                <p className={`text-[10px] text-slate-500 uppercase tracking-widest mb-3 font-semibold ${collapsed ? 'text-center' : ''}`}>
                    {collapsed ? 'DOM' : 'Domains'}
                </p>
                <nav className="space-y-1">
                    {variants.map(v => {
                        const active = activeVariant === v.id;
                        return (
                            <button
                                key={v.id}
                                onClick={() => onVariantChange(v.id)}
                                title={collapsed ? v.label : ''}
                                className={`w-full flex items-center ${collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'} rounded-xl text-sm transition-all duration-200 group relative
                                    ${active ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'}`}
                            >
                                {active && !collapsed && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-blue-500 rounded-r-md"></div>
                                )}
                                <Icon path={ICONS.domain} className={`w-5 h-5 ${active ? 'text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'group-hover:text-blue-400'}`} />
                                {!collapsed && <span className="font-medium">{v.label}</span>}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Menu */}
            <div className="p-4 border-t border-slate-800/80 flex-1">
                <p className={`text-[10px] text-slate-500 uppercase tracking-widest mb-3 font-semibold ${collapsed ? 'text-center' : ''}`}>
                    {collapsed ? 'MENU' : 'Menu'}
                </p>
                <nav className="space-y-1">
                    {menuItems.map(item => {
                        const active = currentView === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => onViewChange(item.id)}
                                title={collapsed ? item.label : ''}
                                className={`w-full flex items-center ${collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'} rounded-xl text-sm transition-all duration-200 group relative
                                    ${active ? 'bg-blue-600/10 text-white border border-blue-500/20 shadow-[0_0_15px_-3px_rgba(59,130,246,0.1)]' : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'}`}
                            >
                                {active && !collapsed && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-3/4 bg-blue-500 rounded-r-md"></div>
                                )}
                                <Icon path={item.icon} className={`w-5 h-5 ${active ? 'text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'group-hover:text-slate-300'}`} />
                                {!collapsed && <span className="font-medium">{item.label}</span>}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Stats */}
            {!collapsed && (
                <div className="p-4 border-t border-slate-800/80">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-3 font-semibold">System</p>
                    <div className="space-y-2.5 text-xs bg-slate-900/50 p-3 rounded-xl border border-slate-800/80">
                        <div className="flex justify-between items-center text-slate-400">
                            <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> Online</span>
                            <span className="text-white font-medium">{stats?.onlineDevices ?? 0}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-400">
                            <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> Logs</span>
                            <span className="text-white font-medium">{stats?.totalLogs ?? 0}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-400">
                            <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div> Alerts</span>
                            <span className="text-red-400 font-medium">{stats?.criticalAlerts ?? 0}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Connection Status & Logout */}
            <div className={`p-4 border-t border-slate-800/80 flex ${collapsed ? 'flex-col gap-4' : 'justify-between items-center'}`}>
                <div className={`flex items-center gap-2 text-[10px] text-slate-500 ${collapsed ? 'justify-center' : ''}`} title="Connected to Core">
                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_6px_rgba(16,185,129,0.8)] animate-pulse" />
                    {!collapsed && <span>Connected</span>}
                </div>
                <button 
                    onClick={onLogout}
                    title={collapsed ? "Logout" : ""}
                    className={`flex items-center justify-center gap-1.5 text-xs text-red-400 hover:text-white hover:bg-red-500/20 ${collapsed ? 'p-2' : 'px-3 py-1.5'} rounded-lg transition-colors`}
                >
                    <Icon path={ICONS.logout} className="w-4 h-4" />
                    {!collapsed && <span>Logout</span>}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
