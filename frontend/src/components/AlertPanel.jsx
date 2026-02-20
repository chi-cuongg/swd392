import React, { useState } from 'react';

const AlertPanel = ({ alerts = [] }) => {
    const [isExpanded, setIsExpanded] = useState(true);

    if (alerts.length === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 max-w-md w-full animate-slide-in">
            <div className="glass-card border-red-500/30 overflow-hidden">
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full flex items-center justify-between p-3 bg-red-500/10 hover:bg-red-500/20 transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-sm font-semibold text-red-400">
                            {alerts.length} Active Alert{alerts.length > 1 ? 's' : ''}
                        </span>
                    </div>
                    <span className="text-xs text-slate-400">{isExpanded ? '▼' : '▲'}</span>
                </button>

                {isExpanded && (
                    <div className="max-h-60 overflow-y-auto">
                        {alerts.slice(0, 5).map((alert, i) => (
                            <div key={i} className="p-3 border-t border-slate-700/50 flex gap-3 items-start">
                                <span className={`text-lg mt-0.5 ${alert.status === 'critical' ? '' : ''}`}>
                                    {alert.status === 'critical' ? '🔴' : '🟡'}
                                </span>
                                <div>
                                    <p className="text-xs text-slate-400 uppercase tracking-wider">
                                        {alert.domain} — {new Date(alert.timestamp).toLocaleTimeString()}
                                    </p>
                                    <p className="text-sm text-slate-200 mt-0.5">{alert.message}</p>
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
