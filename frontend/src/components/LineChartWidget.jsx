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
                backgroundColor: '#1e293b',
                titleColor: '#f1f5f9',
                bodyColor: '#94a3b8',
                borderColor: '#334155',
                borderWidth: 1,
                cornerRadius: 8,
                padding: 10,
            },
        },
        scales: {
            x: {
                display: false,
                grid: { display: false },
            },
            y: {
                grid: { color: '#334155', lineWidth: 0.5 },
                ticks: { color: '#94a3b8', font: { size: 10 } },
            },
        },
        interaction: {
            intersect: false,
            mode: 'index',
        },
    };

    return (
        <div className="glass-card p-5 animate-fade-in-up">
            <p className="text-sm text-slate-400 mb-3 font-medium">{title}</p>
            <div className="h-40">
                <Line ref={chartRef} options={options} data={chartData} />
            </div>
        </div>
    );
};

export default LineChartWidget;
