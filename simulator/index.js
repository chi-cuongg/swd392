const axios = require('axios');

// n8n Webhook URLs (Logic Layer)
const N8N_BASE = process.env.N8N_URL || 'http://localhost:5678/webhook';
// Fallback: Direct Core API (bypass n8n)
const CORE_API = process.env.CORE_URL || 'http://localhost:3000/api/ingest';

// Mode flag: 'n8n' (through n8n) or 'direct' (bypass n8n, self-evaluate)
const ROUTE_MODE = process.argv[3] || 'n8n';

// All 5 SPLA Variants
const VARIANTS = {
    home: {
        id: 'dev_home_01',
        domain: 'home',
        n8nPath: '/smart-home',
        generate: () => {
            const temp = 20 + Math.random() * 60;
            const smoke = Math.random() * 100;
            const door = Math.random() > 0.9 ? 1 : 0;
            const motion = Math.random() > 0.7 ? 1 : 0;
            return { temp: +temp.toFixed(1), smoke: +smoke.toFixed(1), door, motion };
        },
        evaluate: (m) => {
            if (m.temp > 50 || m.smoke > 60) return { status: 'critical', message: '🔥 FIRE ALERT!' };
            if (m.temp > 40 || m.smoke > 30) return { status: 'warning', message: '⚠️ Elevated levels.' };
            return { status: 'normal', message: 'All clear.' };
        }
    },
    hospital: {
        id: 'dev_hosp_01',
        domain: 'hospital',
        n8nPath: '/hospital',
        generate: () => {
            const heart_rate = 60 + Math.floor(Math.random() * 100);
            const spo2 = 88 + Math.floor(Math.random() * 12);
            const blood_pressure = 100 + Math.floor(Math.random() * 80);
            return { heart_rate, spo2, blood_pressure };
        },
        evaluate: (m) => {
            if (m.heart_rate > 120 || m.spo2 < 90) return { status: 'critical', message: '🚨 CRITICAL vitals!' };
            if (m.heart_rate > 100 || m.spo2 < 95) return { status: 'warning', message: '⚠️ Vitals need attention.' };
            return { status: 'normal', message: 'Stable.' };
        }
    },
    factory: {
        id: 'dev_fact_01',
        domain: 'factory',
        n8nPath: '/factory',
        generate: () => {
            const machine_temp = 30 + Math.random() * 80;
            const vibration = Math.random() * 100;
            const pressure = 5 + Math.random() * 35;
            return { machine_temp: +machine_temp.toFixed(1), vibration: +vibration.toFixed(1), pressure: +pressure.toFixed(1) };
        },
        evaluate: (m) => {
            if (m.machine_temp > 90 || m.vibration > 80) return { status: 'critical', message: '🏭 Machine malfunction!' };
            if (m.machine_temp > 70 || m.vibration > 50) return { status: 'warning', message: '⚠️ Outside norms.' };
            return { status: 'normal', message: 'Normal.' };
        }
    },
    traffic: {
        id: 'dev_traf_01',
        domain: 'traffic',
        n8nPath: '/traffic',
        generate: () => {
            const vehicle_density = Math.floor(Math.random() * 120);
            const accident = Math.random() > 0.95 ? 1 : 0;
            const congestion = vehicle_density > 90 ? 2 : vehicle_density > 60 ? 1 : 0;
            return { vehicle_density, accident, congestion };
        },
        evaluate: (m) => {
            if (m.accident === 1) return { status: 'critical', message: '🚗 ACCIDENT!' };
            if (m.congestion === 2) return { status: 'warning', message: '🚦 Heavy congestion.' };
            return { status: 'normal', message: 'Normal flow.' };
        }
    },
    farm: {
        id: 'dev_farm_01',
        domain: 'farm',
        n8nPath: '/farm',
        generate: () => {
            const soil_moisture = Math.random() * 100;
            const light_intensity = Math.floor(Math.random() * 1200);
            const ph = 4 + Math.random() * 6;
            return { soil_moisture: +soil_moisture.toFixed(1), light_intensity, ph: +ph.toFixed(1) };
        },
        evaluate: (m) => {
            if (m.soil_moisture < 20 || m.ph > 9) return { status: 'critical', message: '🌾 Soil danger!' };
            if (m.soil_moisture < 30 || m.ph > 8) return { status: 'warning', message: '⚠️ Soil needs attention.' };
            return { status: 'normal', message: 'Optimal.' };
        }
    }
};

const sendData = async (variantKey) => {
    const variant = VARIANTS[variantKey];
    if (!variant) return;

    const metrics = variant.generate();

    if (ROUTE_MODE === 'n8n') {
        // === Route through n8n (Production Flow) ===
        // Simulator sends RAW data to n8n → n8n evaluates → n8n POSTs to Core
        const payload = {
            deviceId: variant.id,
            domain: variant.domain,
            metrics,
            timestamp: Date.now()
        };

        try {
            await axios.post(`${N8N_BASE}/smp-ingest`, payload);
            console.log(`📡 [${variant.domain.toUpperCase()}] → n8n  ${JSON.stringify(metrics)}`);
        } catch (err) {
            console.error(`❌ [${variant.domain}] n8n Error:`, err.message);
        }
    } else {
        // === Direct to Core (Demo/Fallback) ===
        // Simulator evaluates locally and sends directly to Core
        const { status, message } = variant.evaluate(metrics);
        const payload = { deviceId: variant.id, domain: variant.domain, metrics, status, message, timestamp: Date.now() };

        try {
            await axios.post(CORE_API, payload);
            const icon = status === 'critical' ? '🔴' : status === 'warning' ? '🟡' : '🟢';
            console.log(`${icon} [${variant.domain.toUpperCase()}] → Core  ${JSON.stringify(metrics)} → ${status}`);
        } catch (err) {
            console.error(`❌ [${variant.domain}] Core Error:`, err.message);
        }
    }
};

// CLI: node index.js [variant|all] [n8n|direct] [interval_ms]
const mode = process.argv[2] || 'all';
const interval = parseInt(process.argv[4]) || 3000;

console.log(`\n🚀 IoT Simulator Started`);
console.log(`   Variant: ${mode}`);
console.log(`   Route:   ${ROUTE_MODE === 'n8n' ? '📡 Simulator → n8n → Core (Production)' : '⚡ Simulator → Core (Direct)'}`);
console.log(`   Interval: ${interval}ms`);
console.log(`   n8n URL: ${N8N_BASE}`);
console.log(`   Core URL: ${CORE_API}\n`);

setInterval(() => {
    if (mode === 'all') {
        Object.keys(VARIANTS).forEach(k => sendData(k));
    } else if (VARIANTS[mode]) {
        sendData(mode);
    } else {
        console.error(`Unknown variant: ${mode}. Available: ${Object.keys(VARIANTS).join(', ')}`);
        process.exit(1);
    }
}, interval);
