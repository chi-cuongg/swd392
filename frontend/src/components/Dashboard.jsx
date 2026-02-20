import React, { useEffect, useState, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import GaugeWidget from './GaugeWidget';
import LineChartWidget from './LineChartWidget';
import StatusWidget from './StatusWidget';
import MetricCard from './MetricCard';
import AlertPanel from './AlertPanel';
import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

// Widget factory
const renderWidget = (widget, data, history, status, config) => {
    const value = data[widget.key];
    const threshold = config?.thresholds?.[widget.key];

    switch (widget.type) {
        case 'gauge':
            return (
                <GaugeWidget
                    key={`${widget.key}-gauge`}
                    value={value ?? 0}
                    min={widget.min || 0}
                    max={widget.max || 100}
                    label={widget.label}
                    unit={widget.unit}
                    color={config?.color || '#3b82f6'}
                    thresholds={threshold}
                />
            );
        case 'line_chart':
            return (
                <div key={`${widget.key}-chart`} className="col-span-1 md:col-span-2">
                    <LineChartWidget
                        title={widget.label}
                        data={history[widget.key] || []}
                        label={widget.label}
                        unit={widget.unit}
                        color={config?.color || '#3b82f6'}
                    />
                </div>
            );
        case 'status':
            return (
                <StatusWidget
                    key={`${widget.key}-status`}
                    label={widget.label}
                    value={value ?? 0}
                    mapping={threshold?.values}
                />
            );
        case 'card':
            return (
                <MetricCard
                    key={`${widget.key}-card`}
                    label={widget.label}
                    value={value ?? 0}
                    unit={widget.unit}
                    status={status}
                />
            );
        default:
            return null;
    }
};

const Dashboard = ({ activeVariant }) => {
    const socket = useSocket();
    const [config, setConfig] = useState(null);
    const [data, setData] = useState({});
    const [history, setHistory] = useState({});
    const [status, setStatus] = useState('normal');
    const [message, setMessage] = useState('');
    const [alerts, setAlerts] = useState([]);
    const [lastUpdate, setLastUpdate] = useState(null);

    // Fetch variant config from backend
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await axios.get(`${API_BASE}/config/variants/${activeVariant}`);
                setConfig(res.data);
            } catch (err) {
                console.error('Failed to fetch config:', err);
            }
        };
        fetchConfig();
        // Reset data when switching
        setData({});
        setHistory({});
        setStatus('normal');
        setAlerts([]);
    }, [activeVariant]);

    // Socket listener
    useEffect(() => {
        if (!socket) return;

        const handler = (payload) => {
            if (payload.domain !== activeVariant) return;

            setData(payload.metrics);
            setStatus(payload.status);
            setMessage(payload.message);
            setLastUpdate(new Date(payload.timestamp));

            // Update history
            setHistory(prev => {
                const newHistory = { ...prev };
                Object.keys(payload.metrics).forEach(key => {
                    if (!newHistory[key]) newHistory[key] = [];
                    newHistory[key] = [...newHistory[key], { timestamp: payload.timestamp, value: payload.metrics[key] }];
                    if (newHistory[key].length > 30) newHistory[key] = newHistory[key].slice(-30);
                });
                return newHistory;
            });

            // Track alerts
            if (payload.status === 'critical' || payload.status === 'warning') {
                setAlerts(prev => {
                    const newAlerts = [payload, ...prev].slice(0, 20);
                    return newAlerts;
                });
            }
        };

        socket.on('device_update', handler);
        return () => socket.off('device_update', handler);
    }, [socket, activeVariant]);

    if (!config) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-slate-400 text-lg animate-pulse">Loading configuration...</div>
            </div>
        );
    }

    return (
        <div className="flex-1 p-6 overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white">{config.label}</h2>
                    <p className="text-sm text-slate-400 mt-1">{config.description}</p>
                </div>
                <div className="flex items-center gap-4">
                    {lastUpdate && (
                        <span className="text-xs text-slate-500">
                            Last update: {lastUpdate.toLocaleTimeString()}
                        </span>
                    )}
                    <div className={`px-4 py-2 rounded-full text-sm font-semibold uppercase tracking-wider transition-all duration-300 ${status === 'critical'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse-glow'
                            : status === 'warning'
                                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                : 'bg-green-500/20 text-green-400 border border-green-500/30'
                        }`}>
                        {status}
                    </div>
                </div>
            </div>

            {/* Live message */}
            {message && status !== 'normal' && (
                <div className={`mb-6 p-4 rounded-lg border animate-slide-in ${status === 'critical'
                        ? 'bg-red-500/10 border-red-500/30 text-red-300'
                        : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300'
                    }`}>
                    <span className="text-lg mr-2">{status === 'critical' ? '🚨' : '⚠️'}</span>
                    {message}
                </div>
            )}

            {/* Widgets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {config.widgets.map((widget, idx) => (
                    <React.Fragment key={idx}>
                        {renderWidget(widget, data, history, status, config)}
                    </React.Fragment>
                ))}
            </div>

            {/* Alert Panel */}
            <AlertPanel alerts={alerts} />
        </div>
    );
};

export default Dashboard;
