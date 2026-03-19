import React, { useEffect, useState } from 'react';

const StatusWidget = ({ label, value, mapping }) => {
    const displayValue = mapping ? (mapping[value] || 'Unknown') : value;
    const isAlert = value === 1 || value === 2 || value === 'Detected' || String(displayValue).includes('Accident') || String(displayValue).includes('Heavy');
    
    const [isPulsing, setIsPulsing] = useState(false);
    useEffect(() => {
        setIsPulsing(true);
        const timer = setTimeout(() => setIsPulsing(false), 500);
        return () => clearTimeout(timer);
    }, [value]);

    return (
        <div className={`glass-card p-6 animate-fade-in-up relative overflow-hidden group ${isAlert ? 'border-red-500/40' : ''}`}>
             <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full blur-3xl opacity-20 transition-all duration-500 group-hover:opacity-30 ${isPulsing ? 'scale-110 opacity-40' : 'scale-100'} ${isAlert ? 'bg-red-500' : 'bg-green-500'}`} />
            
            <div className="flex items-center gap-3 mb-4 relative z-10">
                <div className={`p-2.5 rounded-xl border ${isAlert ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-green-500/10 border-green-500/20 text-green-500'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <p className="text-sm text-slate-400 font-medium uppercase tracking-wider">{label}</p>
            </div>
            
            <div className="flex items-center gap-3 relative z-10">
                <div className="relative flex h-3 w-3">
                    {isAlert && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>}
                    <span className={`relative inline-flex rounded-full h-3 w-3 ${isAlert ? 'bg-red-500' : 'bg-green-500'}`}></span>
                </div>
                <span className={`text-2xl font-bold tracking-tight transition-colors duration-300 ${isAlert ? 'text-red-400' : 'text-green-400'} ${isPulsing ? 'brightness-150' : ''}`}>
                    {displayValue}
                </span>
            </div>
        </div>
    );
};

export default StatusWidget;
