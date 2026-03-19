import React, { useEffect, useState } from 'react';

const getIconPath = (label = '', unit = '') => {
    const text = (label + ' ' + unit).toLowerCase();
    if (text.includes('temp') || text.includes('°c') || text.includes('celsius')) 
        return "M12 2.25a3.75 3.75 0 00-3.75 3.75v8.558a4.5 4.5 0 107.5 0V6a3.75 3.75 0 00-3.75-3.75z M12 6v6"; // Thermometer
    if (text.includes('humid') || text.includes('%')) 
        return "M12 2.25c-3 4.5-6 7.5-6 10.5a6 6 0 1012 0c0-3-3-6-6-10.5z"; // Droplet
    if (text.includes('press') || text.includes('hpa')) 
        return "M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5z M12 12l3.5-3.5 M12 12v4.5"; // Gauge
    if (text.includes('gas') || text.includes('pm')) 
        return "M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z"; // Cloud
    if (text.includes('vibra') || text.includes('motion') || text.includes('speed'))
        return "M3 13.5l4.5-4.5 4.5 4.5 6-6 3 3"; // Wave/Activity
    
    // Default chart bar
    return "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z";
};

const MetricCard = ({ label, value, unit, status }) => {
    const [isPulsing, setIsPulsing] = useState(false);
    
    // Animate on value change
    useEffect(() => {
        setIsPulsing(true);
        const timer = setTimeout(() => setIsPulsing(false), 500);
        return () => clearTimeout(timer);
    }, [value]);

    const statusStyle = 
        status === 'critical' ? {
            color: 'text-red-400',
            bg: 'bg-red-500/10',
            border: 'border-red-500/20',
            iconColor: 'text-red-500',
            dot: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse'
        } : status === 'warning' ? {
            color: 'text-yellow-400',
            bg: 'bg-yellow-500/10',
            border: 'border-yellow-500/20',
            iconColor: 'text-yellow-500',
            dot: 'bg-yellow-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]'
        } : {
            color: 'text-green-400',
            bg: 'bg-green-500/10',
            border: 'border-green-500/20',
            iconColor: 'text-blue-400', // Default icon color instead of green to not overwhem with green
            dot: 'bg-green-500'
        };

    const iconPath = getIconPath(label, unit);

    return (
        <div className={`glass-card p-6 animate-fade-in-up relative overflow-hidden group ${status === 'critical' ? 'border-red-500/30' : ''}`}>
            {/* Background Glow */}
            <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full blur-3xl opacity-20 transition-all duration-500 group-hover:opacity-30 ${isPulsing ? 'scale-110 opacity-40' : 'scale-100'} ${statusStyle.bg.replace('/10', '')}`} />
            
            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${statusStyle.bg} border ${statusStyle.border}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${statusStyle.iconColor}`}>
                            <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
                        </svg>
                    </div>
                    <p className="text-sm text-slate-400 font-medium uppercase tracking-wider">{label}</p>
                </div>
                {status && (
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${statusStyle.bg} ${statusStyle.border} ${statusStyle.color}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">{status}</span>
                    </div>
                )}
            </div>
            
            <div className="flex items-baseline gap-2 relative z-10">
                <span className={`text-4xl font-bold tracking-tight transition-colors duration-300 ${isPulsing ? 'text-white' : 'text-slate-100'}`}>
                    {typeof value === 'number' ? value.toFixed(1) : (value || '--')}
                </span>
                <span className="text-sm font-medium text-slate-500">{unit}</span>
            </div>
        </div>
    );
};

export default MetricCard;
