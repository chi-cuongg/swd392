module.exports = {
    id: 'hospital',
    organizationId: 'org_hospital',
    organizationName: 'Smart Hospital Org',
    label: 'Smart Hospital',
    description: 'Patient vital signs monitoring: heart rate, SpO2, blood pressure.',
    icon: 'Heart',
    color: '#EF4444',
    thresholds: {
        heart_rate: { warn: 100, critical: 120, unit: 'bpm' },
        spo2: { warn: 95, critical: 90, unit: '%', invertWarning: true },
        blood_pressure: { warn: 140, critical: 160, unit: 'mmHg' }
    },
    widgets: [
        { key: 'heart_rate', label: 'Heart Rate', unit: 'bpm', type: 'gauge', min: 40, max: 200, icon: 'Activity' },
        { key: 'spo2', label: 'SpO2', unit: '%', type: 'gauge', min: 80, max: 100, icon: 'Droplets' },
        { key: 'heart_rate', label: 'Heart Rate History', unit: 'bpm', type: 'line_chart', icon: 'TrendingUp' },
        { key: 'spo2', label: 'SpO2 History', unit: '%', type: 'line_chart', icon: 'TrendingUp' },
        { key: 'blood_pressure', label: 'Blood Pressure', unit: 'mmHg', type: 'card', icon: 'Gauge' }
    ],
    metricAliases: {
        heartRate: 'heart_rate',
        heartrate: 'heart_rate',
        bloodPressure: 'blood_pressure',
        bloodpressure: 'blood_pressure'
    }
};
