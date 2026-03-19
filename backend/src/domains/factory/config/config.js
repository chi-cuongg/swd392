module.exports = {
    id: 'factory',
    organizationId: 'org_factory',
    organizationName: 'Smart Factory Org',
    label: 'Smart Factory',
    description: 'Machine operation monitoring: temperature, vibration, pressure.',
    icon: 'Factory',
    color: '#F59E0B',
    thresholds: {
        machine_temp: { warn: 70, critical: 90, unit: 'C' },
        vibration: { warn: 50, critical: 80, unit: 'Hz' },
        pressure: { warn: 25, critical: 35, unit: 'Psi' }
    },
    widgets: [
        { key: 'machine_temp', label: 'Machine Temp', unit: 'C', type: 'gauge', min: 0, max: 120, icon: 'Thermometer' },
        { key: 'vibration', label: 'Vibration', unit: 'Hz', type: 'gauge', min: 0, max: 100, icon: 'Zap' },
        { key: 'vibration', label: 'Vibration History', unit: 'Hz', type: 'line_chart', icon: 'TrendingUp' },
        { key: 'pressure', label: 'Pressure', unit: 'Psi', type: 'card', icon: 'ArrowUpDown' }
    ],
    metricAliases: {
        machineTemperature: 'machine_temp',
        machine_temp_c: 'machine_temp',
        'machine-temp': 'machine_temp',
        temp: 'machine_temp'
    }
};
