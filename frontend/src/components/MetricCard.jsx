import React from 'react';

const MetricCard = ({ label, value, unit, icon: Icon, status, color }) => {
    const statusColor = status === 'critical' ? 'text-red-400 bg-red-500/10 border-red-500/20'
        : status === 'warning' ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
            : 'text-green-400 bg-green-500/10 border-green-500/20';

    return (
        <div className={`glass-card p-5 animate-fade-in-up`}>
            <p className="text-sm text-slate-400 mb-1 font-medium">{label}</p>
            <div className="flex items-end justify-between">
                <div>
                    <span className="text-3xl font-bold text-slate-100">
                        {typeof value === 'number' ? value.toFixed(1) : value}
                    </span>
                    <span className="text-sm text-slate-400 ml-1">{unit}</span>
                </div>
                {status && (
                    <span className={`text-xs px-2 py-1 rounded-full border ${statusColor}`}>
                        {status}
                    </span>
                )}
            </div>
        </div>
    );
};

export default MetricCard;
