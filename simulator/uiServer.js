const fs = require('fs');
const path = require('path');
const express = require('express');
const axios = require('axios');

const app = express();
const PORT = Number(process.env.SIM_UI_PORT || 4060);
const N8N_BASE = process.env.N8N_URL || 'http://localhost:5678/webhook';
const CORE_API = process.env.CORE_URL || 'http://localhost:3000/api/ingest';
const INGEST_API_KEY = process.env.INGEST_API_KEY || 'spla_ingest_dev_key';
const CORE_BASE = process.env.CORE_BASE || CORE_API.replace(/\/api\/ingest$/, '');

const VARIANTS = {
    home: {
        id: 'dev_home_01',
        organizationId: 'org_home',
        domain: 'home',
        devices: [
            { id: 'dev_home_temp_01', name: 'Home Temp Sensor', metricKeys: ['temp'] },
            { id: 'dev_home_smoke_01', name: 'Home Smoke Sensor', metricKeys: ['smoke'] },
            { id: 'dev_home_access_01', name: 'Home Access Sensor', metricKeys: ['door', 'motion'] }
        ],
        n8nPath: '/ingest',
        generateRandom: () => {
            const temp = 20 + Math.random() * 60;
            const smoke = Math.random() * 100;
            const door = Math.random() > 0.9 ? 1 : 0;
            const motion = Math.random() > 0.7 ? 1 : 0;
            return { temp: +temp.toFixed(1), smoke: +smoke.toFixed(1), door, motion };
        },
        evaluate: (m) => {
            if (m.temp > 50 || m.smoke > 60) return { status: 'critical', message: 'FIRE ALERT' };
            if (m.temp > 40 || m.smoke > 30) return { status: 'warning', message: 'Elevated levels' };
            return { status: 'normal', message: 'All clear' };
        }
    },
    hospital: {
        id: 'dev_hosp_01',
        organizationId: 'org_hospital',
        domain: 'hospital',
        devices: [
            { id: 'dev_hosp_hr_01', name: 'Hospital Heart Sensor', metricKeys: ['heart_rate'] },
            { id: 'dev_hosp_spo2_01', name: 'Hospital SpO2 Sensor', metricKeys: ['spo2'] },
            { id: 'dev_hosp_bp_01', name: 'Hospital BP Sensor', metricKeys: ['blood_pressure'] }
        ],
        n8nPath: '/ingest',
        generateRandom: () => {
            const heart_rate = 60 + Math.floor(Math.random() * 100);
            const spo2 = 88 + Math.floor(Math.random() * 12);
            const blood_pressure = 100 + Math.floor(Math.random() * 80);
            return { heart_rate, spo2, blood_pressure };
        },
        evaluate: (m) => {
            if (m.heart_rate > 120 || m.spo2 < 90) return { status: 'critical', message: 'Critical vitals' };
            if (m.heart_rate > 100 || m.spo2 < 95) return { status: 'warning', message: 'Vitals need attention' };
            return { status: 'normal', message: 'Stable' };
        }
    },
    factory: {
        id: 'dev_fact_01',
        organizationId: 'org_factory',
        domain: 'factory',
        devices: [
            { id: 'dev_fact_temp_01', name: 'Factory Temp Sensor', metricKeys: ['machine_temp'] },
            { id: 'dev_fact_vib_01', name: 'Factory Vibration Sensor', metricKeys: ['vibration'] },
            { id: 'dev_fact_pressure_01', name: 'Factory Pressure Sensor', metricKeys: ['pressure'] }
        ],
        n8nPath: '/ingest',
        generateRandom: () => {
            const machine_temp = 30 + Math.random() * 80;
            const vibration = Math.random() * 100;
            const pressure = 5 + Math.random() * 35;
            return {
                machine_temp: +machine_temp.toFixed(1),
                vibration: +vibration.toFixed(1),
                pressure: +pressure.toFixed(1)
            };
        },
        evaluate: (m) => {
            if (m.machine_temp > 90 || m.vibration > 80) return { status: 'critical', message: 'Machine malfunction' };
            if (m.machine_temp > 70 || m.vibration > 50) return { status: 'warning', message: 'Outside norms' };
            return { status: 'normal', message: 'Normal' };
        }
    },
    traffic: {
        id: 'dev_traf_01',
        organizationId: 'org_traffic',
        domain: 'traffic',
        devices: [
            { id: 'dev_traf_density_01', name: 'Traffic Density Sensor', metricKeys: ['vehicle_density'] },
            { id: 'dev_traf_incident_01', name: 'Traffic Incident Sensor', metricKeys: ['accident', 'congestion'] }
        ],
        n8nPath: '/ingest',
        generateRandom: () => {
            const vehicle_density = Math.floor(Math.random() * 120);
            const accident = Math.random() > 0.95 ? 1 : 0;
            const congestion = vehicle_density > 90 ? 2 : vehicle_density > 60 ? 1 : 0;
            return { vehicle_density, accident, congestion };
        },
        evaluate: (m) => {
            if (m.accident === 1) return { status: 'critical', message: 'Accident detected' };
            if (m.congestion === 2) return { status: 'warning', message: 'Heavy congestion' };
            return { status: 'normal', message: 'Normal flow' };
        }
    },
    farm: {
        id: 'dev_farm_01',
        organizationId: 'org_farm',
        domain: 'farm',
        devices: [
            { id: 'dev_farm_moisture_01', name: 'Farm Moisture Sensor', metricKeys: ['soil_moisture'] },
            { id: 'dev_farm_light_01', name: 'Farm Light Sensor', metricKeys: ['light_intensity'] },
            { id: 'dev_farm_ph_01', name: 'Farm pH Sensor', metricKeys: ['ph'] }
        ],
        n8nPath: '/ingest',
        generateRandom: () => {
            const soil_moisture = Math.random() * 100;
            const light_intensity = Math.floor(Math.random() * 1200);
            const ph = 4 + Math.random() * 6;
            return { soil_moisture: +soil_moisture.toFixed(1), light_intensity, ph: +ph.toFixed(1) };
        },
        evaluate: (m) => {
            if (m.soil_moisture < 20 || m.ph > 9) return { status: 'critical', message: 'Soil danger' };
            if (m.soil_moisture < 30 || m.ph > 8) return { status: 'warning', message: 'Soil needs attention' };
            return { status: 'normal', message: 'Optimal' };
        }
    }
};

const scenarioCache = {};
const scenarioState = {};
const logs = [];
let sequenceCounter = 0;
let timer = null;
let autoConfig = {
    variant: 'factory',
    routeMode: 'n8n',
    dataMode: 'scenario',
    intervalMs: 2500,
    organizationIdOverride: '',
    deviceIdPrefix: ''
};

const pushLog = (level, message, meta = {}) => {
    const line = {
        ts: new Date().toISOString(),
        level,
        message,
        meta
    };
    logs.unshift(line);
    if (logs.length > 200) {
        logs.length = 200;
    }
    console.log(`[${line.ts}] ${level.toUpperCase()} ${message}`);
};

const loadScenario = (variantKey) => {
    if (Object.prototype.hasOwnProperty.call(scenarioCache, variantKey)) {
        return scenarioCache[variantKey];
    }

    const filePath = path.join(__dirname, 'scenarios', `${variantKey}.json`);
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const parsed = JSON.parse(content);
        if (!Array.isArray(parsed) || parsed.length === 0) {
            throw new Error('Scenario must be a non-empty array');
        }
        scenarioCache[variantKey] = parsed;
        scenarioState[variantKey] = scenarioState[variantKey] || 0;
        return parsed;
    } catch (err) {
        pushLog('warn', `Failed loading scenario for ${variantKey}, fallback to random`, { error: err.message });
        scenarioCache[variantKey] = null;
        return null;
    }
};

const getScenarioStep = (variantKey, consume = true) => {
    const scenario = loadScenario(variantKey);
    if (!scenario) {
        return null;
    }

    const idx = scenarioState[variantKey] || 0;
    const step = scenario[idx];
    if (consume) {
        scenarioState[variantKey] = (idx + 1) % scenario.length;
    }

    return {
        metrics: step.metrics,
        label: step.label || `step_${idx + 1}`,
        stepIndex: idx + 1,
        totalSteps: scenario.length
    };
};

const resetScenario = (variantKey) => {
    if (variantKey === 'all') {
        Object.keys(VARIANTS).forEach((key) => {
            scenarioState[key] = 0;
        });
        return;
    }
    scenarioState[variantKey] = 0;
};

const getLocalMetricSchema = (variantKey) => {
    const variant = VARIANTS[variantKey];
    if (!variant) return { keys: [], aliases: {} };

    const sample = variant.generateRandom();
    return {
        domain: variant.domain,
        keys: Object.keys(sample || {}),
        aliases: {}
    };
};

const buildVariantMetrics = (variantKey, dataMode, metricsOverride, consumeScenario = true) => {
    const variant = VARIANTS[variantKey];
    if (!variant) {
        throw new Error(`Unknown variant: ${variantKey}`);
    }

    if (metricsOverride && typeof metricsOverride === 'object') {
        return {
            metrics: metricsOverride,
            label: 'manual_override',
            stepIndex: null,
            totalSteps: null
        };
    }

    if (dataMode === 'scenario') {
        const step = getScenarioStep(variantKey, consumeScenario);
        if (step) {
            return step;
        }
    }

    return {
        metrics: variant.generateRandom(),
        label: 'random',
        stepIndex: null,
        totalSteps: null
    };
};

const splitMetricsByDevices = (variant, metrics) => {
    const devices = Array.isArray(variant.devices) && variant.devices.length > 0 ?
        variant.devices :
        [{ id: variant.id, name: `Device ${variant.id}`, metricKeys: Object.keys(metrics || {}) }];

    const map = new Map(devices.map((device) => [device.id, {}]));
    const fallbackId = devices[0].id;

    for (const [metricKey, value] of Object.entries(metrics || {})) {
        const owner = devices.find((device) => Array.isArray(device.metricKeys) && device.metricKeys.includes(metricKey));
        const targetId = owner ? owner.id : fallbackId;
        map.get(targetId)[metricKey] = value;
    }

    return devices
        .map((device) => ({ deviceId: device.id, deviceName: device.name || `Device ${device.id}`, metrics: map.get(device.id) || {} }))
        .filter((item) => Object.keys(item.metrics).length > 0);
};

const buildDeviceId = (deviceId, prefix) => {
    const normalizedPrefix = String(prefix || '').trim();
    if (!normalizedPrefix) return deviceId;
    return `${normalizedPrefix}_${deviceId}`;
};

const sendVariant = async ({
    variantKey,
    routeMode,
    dataMode,
    metricsOverride,
    forceStatus,
    forceMessage,
    organizationIdOverride,
    deviceIdPrefix,
    consumeScenario = true
}) => {
    const variant = VARIANTS[variantKey];
    if (!variant) {
        throw new Error(`Unknown variant: ${variantKey}`);
    }

    const targetOrganizationId = String(organizationIdOverride || '').trim() || variant.organizationId;
    const payloadData = buildVariantMetrics(variantKey, dataMode, metricsOverride, consumeScenario);
    const baseTimestamp = Date.now();
    const payloads = splitMetricsByDevices(variant, payloadData.metrics).map((chunk) => ({
        organizationId: targetOrganizationId,
        deviceId: buildDeviceId(chunk.deviceId, deviceIdPrefix),
        deviceName: chunk.deviceName,
        domain: variant.domain,
        metrics: chunk.metrics,
        timestamp: baseTimestamp,
        sequence: ++sequenceCounter,
        meta: {
            source: 'simulator-ui',
            variant: variantKey,
            organizationIdOverride: targetOrganizationId
        }
    }));

    const stepText = payloadData.stepIndex ?
        `[${payloadData.stepIndex}/${payloadData.totalSteps}] ${payloadData.label}` :
        payloadData.label;

    if (routeMode === 'n8n') {
        const n8nUrl = `${N8N_BASE}${variant.n8nPath}`;
        try {
            const responses = [];
            for (const payload of payloads) {
                const response = await axios.post(n8nUrl, payload);
                responses.push({ deviceId: payload.deviceId, status: response.status });
                pushLog('info', `${variantKey}/${payload.deviceId} -> n8n (${stepText})`, {
                    status: response.status,
                    metrics: payload.metrics
                });
            }
            return { ok: true, channel: 'n8n', step: stepText, responseStatus: 200, payloads, responses };
        } catch (err) {
            pushLog('warn', `${variantKey} n8n failed, fallback direct`, { error: err.message });
        }
    }

    const responses = [];
    for (const payload of payloads) {
        const directPayload = {
            ...payload,
            ...(forceStatus ? { status: forceStatus } : {}),
            ...(forceMessage ? { message: forceMessage } : {})
        };

        const response = await axios.post(CORE_API, directPayload, {
            headers: {
                'x-ingest-key': INGEST_API_KEY
            }
        });
        const computedStatus = response && response.data ? response.data.status : undefined;
        responses.push({ deviceId: payload.deviceId, status: response.status, computedStatus });
        pushLog('info', `${variantKey}/${payload.deviceId} -> core (${stepText})`, {
            status: response.status,
            severity: computedStatus,
            metrics: directPayload.metrics
        });
    }

    return {
        ok: true,
        channel: 'core',
        step: stepText,
        responseStatus: 200,
        payloads,
        responses
    };
};

const sendOnce = async ({
    variant,
    routeMode,
    dataMode,
    metricsOverride,
    forceStatus,
    forceMessage,
    organizationIdOverride,
    deviceIdPrefix,
    consumeScenario = true
}) => {
    if (variant === 'all') {
        const results = [];
        for (const key of Object.keys(VARIANTS)) {
            const result = await sendVariant({
                variantKey: key,
                routeMode,
                dataMode,
                metricsOverride: null,
                forceStatus,
                forceMessage,
                organizationIdOverride,
                deviceIdPrefix,
                consumeScenario
            });
            results.push({ variant: key, ...result });
        }
        return { mode: 'all', results };
    }

    const result = await sendVariant({
        variantKey: variant,
        routeMode,
        dataMode,
        metricsOverride,
        forceStatus,
        forceMessage,
        organizationIdOverride,
        deviceIdPrefix,
        consumeScenario
    });

    return { mode: 'single', variant, result };
};

const startAuto = ({ variant, routeMode, dataMode, intervalMs, organizationIdOverride, deviceIdPrefix }) => {
    if (timer) {
        clearInterval(timer);
    }

    autoConfig = {
        variant,
        routeMode,
        dataMode,
        intervalMs,
        organizationIdOverride: String(organizationIdOverride || '').trim(),
        deviceIdPrefix: String(deviceIdPrefix || '').trim()
    };

    timer = setInterval(() => {
        sendOnce({
            variant: autoConfig.variant,
            routeMode: autoConfig.routeMode,
            dataMode: autoConfig.dataMode,
            metricsOverride: null,
            forceStatus: null,
            forceMessage: null,
            organizationIdOverride: autoConfig.organizationIdOverride,
            deviceIdPrefix: autoConfig.deviceIdPrefix
        }).catch((err) => {
            pushLog('error', 'Autoplay tick failed', { error: err.message });
        });
    }, intervalMs);

    pushLog('info', 'Autoplay started', autoConfig);
};

const stopAuto = () => {
    if (!timer) {
        return;
    }
    clearInterval(timer);
    timer = null;
    pushLog('info', 'Autoplay stopped');
};

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/variants', (req, res) => {
    const variants = Object.keys(VARIANTS).map((key) => ({
        key,
        domain: VARIANTS[key].domain,
        organizationId: VARIANTS[key].organizationId,
        devices: (VARIANTS[key].devices || []).map((device) => ({
            id: device.id,
            name: device.name,
            metricKeys: Array.isArray(device.metricKeys) ? device.metricKeys : []
        }))
    }));
    res.json({ variants });
});

app.get('/api/preview', (req, res) => {
    const variant = req.query.variant || 'factory';
    if (!VARIANTS[variant]) {
        return res.status(400).json({ error: 'Invalid variant' });
    }
    const preview = getScenarioStep(variant, false);
    return res.json({ preview, pointer: scenarioState[variant] || 0 });
});

app.get('/api/state', (req, res) => {
    res.json({
        running: Boolean(timer),
        autoConfig,
        scenarioState,
        logs: logs.slice(0, 80)
    });
});

app.post('/api/send', async (req, res) => {
    const {
        variant = 'factory',
        routeMode = 'n8n',
        dataMode = 'scenario',
        metrics = null,
        forceStatus = null,
        forceMessage = null,
        organizationIdOverride = '',
        deviceIdPrefix = '',
        consumeScenario = true
    } = req.body || {};

    if (routeMode !== 'n8n' && routeMode !== 'direct') {
        return res.status(400).json({ error: 'Invalid routeMode' });
    }
    if (dataMode !== 'scenario' && dataMode !== 'random') {
        return res.status(400).json({ error: 'Invalid dataMode' });
    }
    if (variant !== 'all' && !VARIANTS[variant]) {
        return res.status(400).json({ error: 'Invalid variant' });
    }

    try {
        const result = await sendOnce({
            variant,
            routeMode,
            dataMode,
            metricsOverride: metrics,
            forceStatus,
            forceMessage,
            organizationIdOverride,
            deviceIdPrefix,
            consumeScenario: Boolean(consumeScenario)
        });
        return res.json({ ok: true, result });
    } catch (err) {
        pushLog('error', 'Send failed', { error: err.message });
        return res.status(500).json({ ok: false, error: err.message });
    }
});

app.post('/api/start', (req, res) => {
    const {
        variant = 'factory',
        routeMode = 'n8n',
        dataMode = 'scenario',
        intervalMs = 2500,
        organizationIdOverride = '',
        deviceIdPrefix = ''
    } = req.body || {};

    if (variant !== 'all' && !VARIANTS[variant]) {
        return res.status(400).json({ error: 'Invalid variant' });
    }
    if (routeMode !== 'n8n' && routeMode !== 'direct') {
        return res.status(400).json({ error: 'Invalid routeMode' });
    }
    if (dataMode !== 'scenario' && dataMode !== 'random') {
        return res.status(400).json({ error: 'Invalid dataMode' });
    }

    startAuto({
        variant,
        routeMode,
        dataMode,
        intervalMs: Number(intervalMs) || 2500,
        organizationIdOverride,
        deviceIdPrefix
    });

    return res.json({ ok: true, running: true, autoConfig });
});

app.post('/api/stop', (req, res) => {
    stopAuto();
    return res.json({ ok: true, running: false });
});

app.post('/api/reset', (req, res) => {
    const { variant = 'all' } = req.body || {};
    if (variant !== 'all' && !VARIANTS[variant]) {
        return res.status(400).json({ error: 'Invalid variant' });
    }
    resetScenario(variant);
    pushLog('info', 'Scenario pointer reset', { variant });
    return res.json({ ok: true, variant, scenarioState });
});

app.get('/api/metric-schema', async(req, res) => {
    try {
        const variant = req.query.variant || 'factory';
        if (variant !== 'all' && !VARIANTS[variant]) {
            return res.status(400).json({ error: 'Invalid variant' });
        }

        if (variant === 'all') {
            const response = await axios.get(`${CORE_BASE}/api/config/metric-schema`);
            return res.json(response.data);
        }

        const response = await axios.get(`${CORE_BASE}/api/config/metric-schema`, {
            params: { domain: VARIANTS[variant].domain }
        });
        const data = response.data;

        // Accept either { domain, keys, aliases } or full map by domain.
        if (data && Array.isArray(data.keys)) {
            return res.json(data);
        }

        const byDomain = data && typeof data === 'object' ? data[VARIANTS[variant].domain] : null;
        if (byDomain && Array.isArray(byDomain.keys)) {
            return res.json({
                domain: VARIANTS[variant].domain,
                keys: byDomain.keys,
                aliases: byDomain.aliases || {}
            });
        }

        return res.json(getLocalMetricSchema(variant));
    } catch (err) {
        // Keep simulator usable even when backend schema API is unavailable.
        const variant = req.query.variant || 'factory';
        return res.json(getLocalMetricSchema(variant));
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Simulator UI running at http://localhost:${PORT}`);
    pushLog('info', 'Simulator UI booted', { port: PORT, n8n: N8N_BASE, core: CORE_API });
});