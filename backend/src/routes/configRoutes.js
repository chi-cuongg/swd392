const express = require('express');
const router = express.Router();

// SPLA Variant Configurations
// Each variant defines: label, widgets, thresholds, and UI settings
const VARIANT_CONFIGS = {
    home: {
        id: 'home',
        label: 'Smart Home Safety',
        description: 'Monitor home safety parameters: temperature, smoke, door, motion.',
        icon: 'Home',
        color: '#3B82F6',
        thresholds: {
            temp: { warn: 40, critical: 50, unit: '°C' },
            smoke: { warn: 30, critical: 60, unit: '%' },
            door: { values: { 0: 'Closed', 1: 'Open' } },
            motion: { values: { 0: 'None', 1: 'Detected' } }
        },
        widgets: [
            { key: 'temp', label: 'Temperature', unit: '°C', type: 'gauge', min: 0, max: 100, icon: 'Thermometer' },
            { key: 'smoke', label: 'Smoke Level', unit: '%', type: 'gauge', min: 0, max: 100, icon: 'Wind' },
            { key: 'temp', label: 'Temperature History', unit: '°C', type: 'line_chart', icon: 'TrendingUp' },
            { key: 'door', label: 'Door Status', type: 'status', icon: 'DoorOpen' },
            { key: 'motion', label: 'Motion', type: 'status', icon: 'Eye' }
        ]
    },
    hospital: {
        id: 'hospital',
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
        ]
    },
    factory: {
        id: 'factory',
        label: 'Smart Factory',
        description: 'Machine operation monitoring: temperature, vibration, pressure.',
        icon: 'Factory',
        color: '#F59E0B',
        thresholds: {
            machine_temp: { warn: 70, critical: 90, unit: '°C' },
            vibration: { warn: 50, critical: 80, unit: 'Hz' },
            pressure: { warn: 25, critical: 35, unit: 'Psi' }
        },
        widgets: [
            { key: 'machine_temp', label: 'Machine Temp', unit: '°C', type: 'gauge', min: 0, max: 120, icon: 'Thermometer' },
            { key: 'vibration', label: 'Vibration', unit: 'Hz', type: 'gauge', min: 0, max: 100, icon: 'Zap' },
            { key: 'vibration', label: 'Vibration History', unit: 'Hz', type: 'line_chart', icon: 'TrendingUp' },
            { key: 'pressure', label: 'Pressure', unit: 'Psi', type: 'card', icon: 'ArrowUpDown' }
        ]
    },
    traffic: {
        id: 'traffic',
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
        ]
    },
    farm: {
        id: 'farm',
        label: 'Smart Farm',
        description: 'Agriculture monitoring: soil moisture, light intensity, pH level.',
        icon: 'Leaf',
        color: '#22C55E',
        thresholds: {
            soil_moisture: { warn: 30, critical: 20, unit: '%', invertWarning: true },
            light_intensity: { warn: 800, critical: 1000, unit: 'lux' },
            ph: { warn: 8, critical: 9, unit: 'pH' }
        },
        widgets: [
            { key: 'soil_moisture', label: 'Soil Moisture', unit: '%', type: 'gauge', min: 0, max: 100, icon: 'Droplets' },
            { key: 'light_intensity', label: 'Light Intensity', unit: 'lux', type: 'gauge', min: 0, max: 1200, icon: 'Sun' },
            { key: 'ph', label: 'Soil pH', unit: 'pH', type: 'card', icon: 'TestTube' },
            { key: 'soil_moisture', label: 'Moisture History', unit: '%', type: 'line_chart', icon: 'TrendingUp' }
        ]
    }
};

// GET /api/config/variants  — list all variants
router.get('/variants', (req, res) => {
    const summary = Object.values(VARIANT_CONFIGS).map(v => ({
        id: v.id, label: v.label, description: v.description, icon: v.icon, color: v.color
    }));
    res.json(summary);
});

// GET /api/config/variants/:id  — full config for a variant
router.get('/variants/:id', (req, res) => {
    const config = VARIANT_CONFIGS[req.params.id];
    if (!config) return res.status(404).json({ error: 'Variant not found' });
    res.json(config);
});

module.exports = router;
