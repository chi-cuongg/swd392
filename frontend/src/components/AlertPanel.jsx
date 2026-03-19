import React, { useState } from 'react';

const AlertPanel = ({ alerts = [] }) => {
    const [isExpanded, setIsExpanded] = useState(true);

    if (alerts.length === 0) return null;

    const criticalCount = alerts.filter(a => a.status === 'critical').length;

    return (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-fade-scale">
            <div className={`glass-card overflow-hidden shadow-2xl ${criticalCount > 0 ? 'border-red-500/50 shadow-red-900/20' : 'border-yellow-500/50 shadow-yellow-900/20'}`}>
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className={`w-full flex items-center justify-between p-4 transition-colors ${criticalCount > 0 ? 'bg-red-500/15 hover:bg-red-500/25' : 'bg-yellow-500/15 hover:bg-yellow-500/25'}`}
                >
                    <div className="flex items-center gap-3">
                        <div className={`relative flex h-3 w-3`}>
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${criticalCount > 0 ? 'bg-red-400' : 'bg-yellow-400'}`}></span>
                            <span className={`relative inline-flex rounded-full h-3 w-3 ${criticalCount > 0 ? 'bg-red-500' : 'bg-yellow-500'}`}></span>
                        </div>
                        <span className={`font-semibold tracking-wide flex items-center gap-2 ${criticalCount > 0 ? 'text-red-400' : 'text-yellow-400'}`}>
                            {alerts.length} Active Alert{alerts.length > 1 ? 's' : ''}
                        </span>
                    </div>
                    <span className={`text-sm transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''} ${criticalCount > 0 ? 'text-red-400' : 'text-yellow-400'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                    </span>
                </button>

                {isExpanded && (
                    <div className="max-h-72 overflow-y-auto bg-slate-900/50 divide-y divide-slate-800">
                        {alerts.slice(0, 10).map((alert, i) => (
                            <div key={i} className="p-4 flex gap-3 items-start group hover:bg-slate-800/50 transition-colors">
                                <div className={`mt-1 p-1.5 rounded-lg border ${alert.status === 'critical' ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500'}`}>
                                    {alert.status === 'critical' ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                        <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider truncate">
                                            {alert.domain} {alert.deviceId ? `• ${alert.deviceId}` : ''}
                                        </p>
                                        <p className="text-[10px] text-slate-500 whitespace-nowrap">
                                            {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                        </p>
                                    </div>
                                    <p className={`text-sm ${alert.status === 'critical' ? 'text-red-200' : 'text-yellow-200'} leading-snug`}>
                                        {alert.message}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AlertPanel;
