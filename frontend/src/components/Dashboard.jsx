import React, { useEffect, useState } from 'react';
import { useSocket } from '../context/socketContext';
import GaugeWidget from './GaugeWidget';
import LineChartWidget from './LineChartWidget';
import StatusWidget from './StatusWidget';
import MetricCard from './MetricCard';
import AlertPanel from './AlertPanel';
import axios from 'axios';
import { API_BASE } from '../config';

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

const DashboardLive = ({ socket, activeOrganizationId, activeVariant, config }) => {
    const [data, setData] = useState({});
    const [history, setHistory] = useState({});
    const [status, setStatus] = useState('normal');
    const [splitStatus, setSplitStatus] = useState({});
    const [message, setMessage] = useState('');
    const [alerts, setAlerts] = useState([]);
    const [lastUpdate, setLastUpdate] = useState(null);
    const [lastDeviceId, setLastDeviceId] = useState(null);
    const [lastDeviceName, setLastDeviceName] = useState(null);
    const [metricSource, setMetricSource] = useState({});

    useEffect(() => {
        if (!activeOrganizationId || !activeVariant) return;

        const severityRank = { normal: 0, warning: 1, critical: 2 };

        const loadLatestFromLogs = async () => {
            try {
                const res = await axios.get(`${API_BASE}/logs`, {
                    params: {
                        organizationId: activeOrganizationId,
                        domain: activeVariant,
                        limit: 120
                    }
                });

                const logs = Array.isArray(res.data) ? res.data : [];
                if (logs.length === 0) return;

                const latestByMetric = {};
                const historyByMetric = {};
                const sourceByMetric = {};
                const statusByMetric = {};

                let mergedStatus = 'normal';

                for (const row of logs) {
                    const key = row?.metric?.key;
                    if (!key) continue;

                    const value = typeof row.valueNumber === 'number' ? row.valueNumber : null;
                    if (value === null) continue;

                    if (!latestByMetric[key]) {
                        latestByMetric[key] = value;
                        sourceByMetric[key] = row?.device?.name || row?.deviceId || null;
                    }

                    if (!historyByMetric[key]) {
                        historyByMetric[key] = [];
                    }
                    historyByMetric[key].push({ timestamp: row.timestamp, value });

                    if (!statusByMetric[key]) {
                        statusByMetric[key] = row.status || 'normal';
                    }
                }

                Object.keys(statusByMetric).forEach((key) => {
                    const rowStatus = statusByMetric[key];
                    if (severityRank[rowStatus] > severityRank[mergedStatus]) {
                        mergedStatus = rowStatus;
                    }
                });

                Object.keys(historyByMetric).forEach((key) => {
                    historyByMetric[key] = historyByMetric[key].reverse().slice(-30);
                });

                if (Object.keys(latestByMetric).length > 0) {
                    setData(latestByMetric);
                    setHistory(historyByMetric);
                    setStatus(mergedStatus);
                    setSplitStatus(statusByMetric);
                    setLastUpdate(new Date(logs[0].timestamp));
                    setLastDeviceId(logs[0].deviceId || null);
                    setLastDeviceName(logs[0]?.device?.name || null);
                    setMetricSource(sourceByMetric);
                }
            } catch (err) {
                console.error('Failed to load latest logs:', err);
            }
        };

        loadLatestFromLogs();
        const interval = setInterval(loadLatestFromLogs, 4000);

        return () => clearInterval(interval);
    }, [activeOrganizationId, activeVariant]);

    // Socket listener
    useEffect(() => {
        if (!socket || !activeOrganizationId || !activeVariant) return;

        const handler = (payload) => {
            if (payload.organizationId !== activeOrganizationId) return;
            if (payload.domain !== activeVariant) return;

            setData(prev => ({ ...prev, ...payload.metrics }));
            setStatus(payload.status);
            setMessage(payload.message);
            setLastUpdate(new Date(payload.timestamp));
            setLastDeviceId(payload.deviceId || null);
            setLastDeviceName(null);
            setMetricSource(prev => {
                const next = { ...prev };
                Object.keys(payload.metrics || {}).forEach((key) => {
                    next[key] = payload.deviceId;
                });
                return next;
            });

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
                setAlerts(prev => [payload, ...prev].slice(0, 20));
            }
        };

        socket.on('device_update', handler);
        return () => socket.off('device_update', handler);
    }, [socket, activeOrganizationId, activeVariant]);

    return (
        <div className="flex-1 p-6 overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">{config.label}</h2>
                    <p className="text-sm text-slate-400 mt-2">{config.description}</p>
                    {(lastDeviceId || lastDeviceName) && (
                        <p className="text-xs text-slate-500 mt-1">
                            Source: <span className="text-slate-300">{lastDeviceName || lastDeviceId}</span>
                            {lastDeviceName && lastDeviceId ? ` (${lastDeviceId})` : ''}
                        </p>
                    )}
                    {Object.keys(metricSource).length > 0 && (
                        <p className="text-[11px] text-slate-500 mt-1">
                            Metric sources: {Object.entries(metricSource)
                                .map(([key, source]) => `${key}: ${source}`)
                                .join(' | ')}
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-4">
                    {lastUpdate && (
                        <span className="text-xs font-medium text-slate-500 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/50">
                            Updated: {lastUpdate.toLocaleTimeString()}
                        </span>
                    )}
                    <div className={`px-5 py-2 rounded-xl text-sm font-bold uppercase tracking-widest transition-all duration-300 shadow-lg ${status === 'critical'
                            ? 'bg-red-500/20 text-red-500 border border-red-500/30 animate-pulse-glow shadow-red-500/20'
                            : status === 'warning'
                                ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 shadow-yellow-500/10'
                                : 'bg-green-500/20 text-green-500 border border-green-500/30'
                        }`}>
                        System Status: {status}
                    </div>
                </div>
            </div>

            {/* Live message */}
            {message && status !== 'normal' && (
                <div className={`mb-8 p-4 rounded-xl border animate-fade-scale shadow-lg flex items-center gap-3 ${status === 'critical'
                        ? 'bg-red-500/10 border-red-500/30 text-red-400 shadow-red-500/10'
                        : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500 shadow-yellow-500/10'
                    }`}>
                    <span className="text-2xl">{status === 'critical' ? '🚨' : '⚠️'}</span>
                    <span className="font-medium text-sm">{message}</span>
                </div>
            )}

            {/* Widgets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {config.widgets.map((widget, idx) => (
                    <React.Fragment key={idx}>
                        {renderWidget(widget, data, history, splitStatus[widget.key], config)}
                    </React.Fragment>
                ))}
            </div>

            {/* Alert Panel */}
            <AlertPanel alerts={alerts} />
        </div>
    );
};

const Dashboard = ({ activeOrganizationId, activeVariant }) => {
    const socket = useSocket();
    const [config, setConfig] = useState(null);

    // Fetch variant config from backend
    useEffect(() => {
        setConfig(null);
        if (!activeOrganizationId || !activeVariant) return;

        let isMounted = true;
        const fetchConfig = async () => {
            try {
                const res = await axios.get(`${API_BASE}/config/variants/${activeVariant}`, {
                    params: { organizationId: activeOrganizationId }
                });
                if (isMounted) {
                    setConfig(res.data);
                    console.log('Fetched config:', res.data);
                }
            } catch (err) {
                console.error('Failed to fetch config:', err);
            }
        };
        fetchConfig();

        return () => {
            isMounted = false;
        };
    }, [activeOrganizationId, activeVariant]);

    if (!config) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-slate-400 text-lg animate-pulse">Loading configuration...</div>
            </div>
        );
    }

    const scopeKey = `${activeOrganizationId ?? 'unknown'}:${activeVariant ?? 'unknown'}`;

    return (
        <DashboardLive
            key={scopeKey}
            socket={socket}
            activeOrganizationId={activeOrganizationId}
            activeVariant={activeVariant}
            config={config}
        />
    );
};

export default Dashboard;
