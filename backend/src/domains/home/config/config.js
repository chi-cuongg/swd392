module.exports = {
    id: 'home',
    organizationId: 'org_home',
    organizationName: 'Smart Home Org',
    label: 'Smart Home Safety',
    description: 'Monitor home safety parameters: temperature, smoke, door, motion.',
    icon: 'Home',
    color: '#3B82F6',
    thresholds: {
        temp: { warn: 40, critical: 50, unit: 'C' },
        smoke: { warn: 30, critical: 60, unit: '%' },
        door: { values: { 0: 'Closed', 1: 'Open' } },
        motion: { values: { 0: 'None', 1: 'Detected' } }
    },
    widgets: [
        { key: 'temp', label: 'Temperature', unit: 'C', type: 'gauge', min: 0, max: 100, icon: 'Thermometer' },
        { key: 'smoke', label: 'Smoke Level', unit: '%', type: 'gauge', min: 0, max: 100, icon: 'Wind' },
        { key: 'temp', label: 'Temperature History', unit: 'C', type: 'line_chart', icon: 'TrendingUp' },
        { key: 'door', label: 'Door Status', type: 'status', icon: 'DoorOpen' },
        { key: 'motion', label: 'Motion', type: 'status', icon: 'Eye' }
    ],
    metricAliases: {
        temperature: 'temp'
    }
};
