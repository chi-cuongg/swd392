module.exports = {
    id: 'traffic',
    organizationId: 'org_traffic',
    organizationName: 'Smart Traffic Org',
    label: 'Smart Traffic',
    description: 'Traffic monitoring: vehicle density, accident alerts, congestion.',
    icon: 'Car',
    color: '#10B981',
    thresholds: {
        vehicle_density: { warn: 70, critical: 90, unit: 'vehicles/min' },
        accident: { values: { 0: 'Clear', 1: 'Accident Detected' } },
        congestion: { values: { 0: 'Free', 1: 'Moderate', 2: 'Heavy' } }
    },
    widgets: [
        { key: 'vehicle_density', label: 'Vehicle Density', unit: 'v/min', type: 'gauge', min: 0, max: 120, icon: 'Car' },
        { key: 'vehicle_density', label: 'Traffic Flow', unit: 'v/min', type: 'line_chart', icon: 'TrendingUp' },
        { key: 'accident', label: 'Accident Alert', type: 'status', icon: 'AlertTriangle' },
        { key: 'congestion', label: 'Congestion Level', type: 'status', icon: 'Clock' }
    ],
    metricAliases: {
        vehicleDensity: 'vehicle_density'
    }
};
