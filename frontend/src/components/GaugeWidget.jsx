import React from 'react';

const GaugeWidget = ({ value, min = 0, max = 100, label, unit, color = '#3b82f6', thresholds }) => {
    const percentage = Math.min(Math.max(((value - min) / (max - min)) * 100, 0), 100);
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference * 0.75; // 270 degree arc
    const rotation = 135; // Start from bottom-left

    // Determine color from thresholds
    let gaugeColor = color;
    if (thresholds) {
        const hasWarn = typeof thresholds.warn === 'number';
        const hasCritical = typeof thresholds.critical === 'number';
        if (thresholds.invertWarning) {
            if (hasCritical && value < thresholds.critical) gaugeColor = '#ef4444';
            else if (hasWarn && value < thresholds.warn) gaugeColor = '#f59e0b';
            else gaugeColor = '#22c55e';
        } else {
            if (hasCritical && value >= thresholds.critical) gaugeColor = '#ef4444';
            else if (hasWarn && value >= thresholds.warn) gaugeColor = '#f59e0b';
            else gaugeColor = '#22c55e';
        }
    }

    return (
        <div className="glass-card p-6 flex flex-col items-center animate-fade-in-up relative overflow-hidden group">
            {/* Background Glow */}
            <div 
                className="absolute inset-0 opacity-10 transition-opacity duration-500 group-hover:opacity-20 blur-2xl"
                style={{ background: `radial-gradient(circle at center, ${gaugeColor}, transparent 70%)` }}
            />
            
            <p className="text-sm text-slate-400 mb-4 font-medium uppercase tracking-wider relative z-10">{label}</p>
            <div className="relative w-36 h-36">
                <svg className="w-full h-full" viewBox="0 0 140 140">
                    {/* Background arc */}
                    <circle
                        cx="70" cy="70" r={radius}
                        fill="none"
                        stroke="#334155"
                        strokeWidth="10"
                        strokeDasharray={circumference * 0.75}
                        strokeDashoffset="0"
                        strokeLinecap="round"
                        transform={`rotate(${rotation} 70 70)`}
                    />
                    {/* Value arc */}
                    <circle
                        cx="70" cy="70" r={radius}
                        fill="none"
                        stroke={gaugeColor}
                        strokeWidth="10"
                        strokeDasharray={circumference * 0.75}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        className="gauge-ring"
                        transform={`rotate(${rotation} 70 70)`}
                        style={{ filter: `drop-shadow(0 0 6px ${gaugeColor}50)` }}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
                    <span className="text-4xl font-bold tracking-tight" style={{ color: gaugeColor, textShadow: `0 0 20px ${gaugeColor}40` }}>
                        {typeof value === 'number' ? value.toFixed(1) : value}
                    </span>
                    <span className="text-xs font-medium text-slate-500 mt-1">{unit}</span>
                </div>
            </div>
        </div>
    );
};

export default GaugeWidget;
