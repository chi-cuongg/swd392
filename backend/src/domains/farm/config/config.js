module.exports = {
    id: 'farm',
    organizationId: 'org_farm',
    organizationName: 'Smart Farm Org',
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
    ],
    metricAliases: {
        soilMoisture: 'soil_moisture',
        lightIntensity: 'light_intensity'
    }
};
