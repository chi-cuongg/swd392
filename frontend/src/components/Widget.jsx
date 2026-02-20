import React from 'react';
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
} from 'chart.js';
import clsx from 'clsx';
import { AlertTriangle, CheckCircle, Thermometer, Activity } from 'lucide-react';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

export const StatusCard = ({ title, value, unit, status, icon: Icon }) => {
    const statusColor = status === 'critical' ? 'bg-red-100 text-red-600 border-red-200'
        : status === 'warning' ? 'bg-yellow-100 text-yellow-600 border-yellow-200'
            : 'bg-green-100 text-green-600 border-green-200';

    return (
        <div className={clsx("p-4 rounded-xl border shadow-sm flex items-center justify-between", statusColor)}>
            <div>
                <p className="text-sm font-medium opacity-80">{title}</p>
                <h3 className="text-2xl font-bold mt-1">{value} <span className="text-sm font-normal">{unit}</span></h3>
            </div>
            {Icon && <Icon size={32} className="opacity-80" />}
        </div>
    );
};

export const ChartWidget = ({ title, data, label }) => {
    const chartData = {
        labels: data.map(d => new Date(d.timestamp).toLocaleTimeString()),
        datasets: [
            {
                label: label,
                data: data.map(d => d.value),
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.5)',
                tension: 0.4,
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: { position: 'top' },
            title: { display: true, text: title },
        },
        scales: {
            x: { display: false }
        }
    };

    return (
        <div className="p-4 bg-white rounded-xl border shadow-sm">
            <Line options={options} data={chartData} />
        </div>
    );
};
