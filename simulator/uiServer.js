const fs = require('fs');
const path = require('path');
const express = require('express');
const axios = require('axios');

const app = express();
const PORT = Number(process.env.SIM_UI_PORT || 4060);
const N8N_BASE = process.env.N8N_URL || 'http://localhost:5678/webhook';
const CORE_API = process.env.CORE_URL || 'http://localhost:3000/api/ingest';

const VARIANTS = {
    home: {
        id: 'dev_home_01',
        organizationId: 'org_home',
        domain: 'home',
        n8nPath: '/smart-home',
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
        n8nPath: '/hospital',
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
        n8nPath: '/factory',
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
        n8nPath: '/traffic',
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
        n8nPath: '/farm',
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
let timer = null;
let autoConfig = {
    variant: 'factory',
    routeMode: 'n8n',
    dataMode: 'scenario',
    intervalMs: 2500
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

const buildVariantMetrics = (variantKey, dataMode, metricsOverride) => {
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
        const step = getScenarioStep(variantKey, true);
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

const sendVariant = async({ variantKey, routeMode, dataMode, metricsOverride, forceStatus, forceMessage }) => {
    const variant = VARIANTS[variantKey];
    if (!variant) {
        throw new Error(`Unknown variant: ${variantKey}`);
    }

    const payloadData = buildVariantMetrics(variantKey, dataMode, metricsOverride);
    const payload = {
        organizationId: variant.organizationId,
        deviceId: variant.id,
        domain: variant.domain,
        metrics: payloadData.metrics,
        timestamp: Date.now()
    };

    const stepText = payloadData.stepIndex ?
        `[${payloadData.stepIndex}/${payloadData.totalSteps}] ${payloadData.label}` :
        payloadData.label;

    if (routeMode === 'n8n') {
        const n8nUrl = `${N8N_BASE}${variant.n8nPath}`;
        try {
            const response = await axios.post(n8nUrl, payload);
            pushLog('info', `${variantKey} -> n8n (${stepText})`, { status: response.status, metrics: payload.metrics });
            return { ok: true, channel: 'n8n', step: stepText, responseStatus: response.status, payload };
        } catch (err) {
            pushLog('warn', `${variantKey} n8n failed, fallback direct`, { error: err.message });
        }
    }

    const directPayload = {
        ...payload,
        ...(forceStatus ? { status: forceStatus } : {}),
        ...(forceMessage ? { message: forceMessage } : {})
    };

    const response = await axios.post(CORE_API, directPayload);
    pushLog('info', `${variantKey} -> core (${stepText})`, {
        status: response.status,
        severity: response.data ? .status,
        metrics: directPayload.metrics
    });
    return {
        ok: true,
        channel: 'core',
        step: stepText,
        responseStatus: response.status,
        payload: directPayload,
        computedStatus: response.data ? .status
    };
};

const sendOnce = async({ variant, routeMode, dataMode, metricsOverride, forceStatus, forceMessage }) => {
    if (variant === 'all') {
        const results = [];
        for (const key of Object.keys(VARIANTS)) {
            const result = await sendVariant({
                variantKey: key,
                routeMode,
                dataMode,
                metricsOverride: null,
                forceStatus,
                forceMessage
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
        forceMessage
    });

    return { mode: 'single', variant, result };
};

const startAuto = ({ variant, routeMode, dataMode, intervalMs }) => {
    if (timer) {
        clearInterval(timer);
    }

    autoConfig = {
        variant,
        routeMode,
        dataMode,
        intervalMs
    };

    timer = setInterval(() => {
        sendOnce({
            variant: autoConfig.variant,
            routeMode: autoConfig.routeMode,
            dataMode: autoConfig.dataMode,
            metricsOverride: null,
            forceStatus: null,
            forceMessage: null
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
        organizationId: VARIANTS[key].organizationId
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

app.post('/api/send', async(req, res) => {
    const {
        variant = 'factory',
            routeMode = 'n8n',
            dataMode = 'scenario',
            metrics = null,
            forceStatus = null,
            forceMessage = null
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
            forceMessage
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
            intervalMs = 2500
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
        intervalMs: Number(intervalMs) || 2500
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

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Simulator UI running at http://localhost:${PORT}`);
    pushLog('info', 'Simulator UI booted', { port: PORT, n8n: N8N_BASE, core: CORE_API });
});