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
        if (thresholds.invertWarning) {
            if (value < thresholds.critical) gaugeColor = '#ef4444';
            else if (value < thresholds.warn) gaugeColor = '#f59e0b';
            else gaugeColor = '#22c55e';
        } else {
            if (value >= thresholds.critical) gaugeColor = '#ef4444';
            else if (value >= thresholds.warn) gaugeColor = '#f59e0b';
            else gaugeColor = '#22c55e';
        }
    }

    return (
        <div className="glass-card p-5 flex flex-col items-center animate-fade-in-up">
            <p className="text-sm text-slate-400 mb-3 font-medium">{label}</p>
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
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold" style={{ color: gaugeColor }}>
                        {typeof value === 'number' ? value.toFixed(1) : value}
                    </span>
                    <span className="text-xs text-slate-400">{unit}</span>
                </div>
            </div>
        </div>
    );
};

export default GaugeWidget;
