import React, { useRef, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const LineChartWidget = ({ title, data = [], label, unit, color = '#3b82f6' }) => {
    const chartRef = useRef(null);

    const chartData = {
        labels: data.map((_, i) => {
            const d = data[i];
            if (d.timestamp) return new Date(d.timestamp).toLocaleTimeString();
            return `T${i}`;
        }),
        datasets: [
            {
                label: `${label} (${unit})`,
                data: data.map(d => d.value),
                borderColor: color,
                backgroundColor: `${color}15`,
                borderWidth: 2,
                tension: 0.4,
                fill: true,
                pointRadius: 0,
                pointHoverRadius: 5,
                pointHoverBackgroundColor: color,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            title: { display: false },
            tooltip: {
                backgroundColor: '#1a233a',
                titleColor: '#f8fafc',
                bodyColor: '#94a3b8',
                borderColor: 'rgba(51, 65, 85, 0.4)',
                borderWidth: 1,
                cornerRadius: 12,
                padding: 12,
                boxPadding: 4,
            },
        },
        scales: {
            x: {
                display: false,
                grid: { display: false },
            },
            y: {
                grid: { color: 'rgba(51, 65, 85, 0.3)', lineWidth: 1 },
                ticks: { color: '#64748b', font: { size: 11, family: 'Inter' } },
                border: { display: false }
            },
        },
        interaction: {
            intersect: false,
            mode: 'index',
        },
    };

    return (
        <div className="glass-card p-6 animate-fade-in-up h-full flex flex-col relative overflow-hidden group">
            <div 
                className="absolute -left-10 -top-10 w-32 h-32 rounded-full blur-3xl opacity-10 transition-opacity duration-500 group-hover:opacity-20"
                style={{ backgroundColor: color }}
            />
            <p className="text-sm text-slate-400 mb-4 font-medium uppercase tracking-wider relative z-10">{title}</p>
            <div className="h-48 relative z-10">
                <Line ref={chartRef} options={options} data={chartData} />
            </div>
        </div>
    );
};

export default LineChartWidget;
