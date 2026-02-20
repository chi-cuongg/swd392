import React from 'react';

const StatusWidget = ({ label, value, icon: Icon, mapping }) => {
    const displayValue = mapping ? (mapping[value] || 'Unknown') : value;
    const isAlert = value === 1 || value === 2 || value === 'Detected' || displayValue.includes('Accident') || displayValue.includes('Heavy');

    return (
        <div className={`glass-card p-5 animate-fade-in-up ${isAlert ? 'animate-pulse-glow border-red-500/30' : ''}`}>
            <p className="text-sm text-slate-400 mb-2 font-medium">{label}</p>
            <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${isAlert ? 'bg-red-500' : 'bg-green-500'}`} />
                <span className={`text-lg font-semibold ${isAlert ? 'text-red-400' : 'text-green-400'}`}>
                    {displayValue}
                </span>
            </div>
        </div>
    );
};

export default StatusWidget;
