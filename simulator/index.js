const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:3000/api/ingest';

// All 5 SPLA Variants
const VARIANTS = {
    home: {
        id: 'dev_home_01',
        domain: 'home',
        generate: () => {
            const temp = 20 + Math.random() * 60;            // 20-80
            const smoke = Math.random() * 100;                // 0-100
            const door = Math.random() > 0.9 ? 1 : 0;        // Mostly closed
            const motion = Math.random() > 0.7 ? 1 : 0;      // Occasional  
            return { temp: +temp.toFixed(1), smoke: +smoke.toFixed(1), door, motion };
        },
        evaluate: (m) => {
            if (m.temp > 50 || m.smoke > 60) return { status: 'critical', message: '🔥 FIRE ALERT! Temperature or smoke dangerously high!' };
            if (m.temp > 40 || m.smoke > 30) return { status: 'warning', message: '⚠️ Warning: Elevated temperature or smoke levels.' };
            return { status: 'normal', message: 'All systems normal.' };
        }
    },
    hospital: {
        id: 'dev_hosp_01',
        domain: 'hospital',
        generate: () => {
            const heart_rate = 60 + Math.floor(Math.random() * 100);   // 60-160
            const spo2 = 88 + Math.floor(Math.random() * 12);          // 88-100
            const blood_pressure = 100 + Math.floor(Math.random() * 80); // 100-180
            return { heart_rate, spo2, blood_pressure };
        },
        evaluate: (m) => {
            if (m.heart_rate > 120 || m.spo2 < 90) return { status: 'critical', message: '🚨 CRITICAL: Patient vitals abnormal!' };
            if (m.heart_rate > 100 || m.spo2 < 95) return { status: 'warning', message: '⚠️ Warning: Vitals need attention.' };
            return { status: 'normal', message: 'Patient vitals stable.' };
        }
    },
    factory: {
        id: 'dev_fact_01',
        domain: 'factory',
        generate: () => {
            const machine_temp = 30 + Math.random() * 80;    // 30-110
            const vibration = Math.random() * 100;            // 0-100
            const pressure = 5 + Math.random() * 35;          // 5-40
            return { machine_temp: +machine_temp.toFixed(1), vibration: +vibration.toFixed(1), pressure: +pressure.toFixed(1) };
        },
        evaluate: (m) => {
            if (m.machine_temp > 90 || m.vibration > 80) return { status: 'critical', message: '🏭 CRITICAL: Machine malfunction detected!' };
            if (m.machine_temp > 70 || m.vibration > 50) return { status: 'warning', message: '⚠️ Warning: Machine operating outside norms.' };
            return { status: 'normal', message: 'All machines operating normally.' };
        }
    },
    traffic: {
        id: 'dev_traf_01',
        domain: 'traffic',
        generate: () => {
            const vehicle_density = Math.floor(Math.random() * 120);   // 0-120
            const accident = Math.random() > 0.95 ? 1 : 0;             // Rare
            const congestion = vehicle_density > 90 ? 2 : vehicle_density > 60 ? 1 : 0;
            return { vehicle_density, accident, congestion };
        },
        evaluate: (m) => {
            if (m.accident === 1) return { status: 'critical', message: '🚗 ACCIDENT DETECTED! Emergency response needed!' };
            if (m.congestion === 2) return { status: 'warning', message: '🚦 Heavy traffic congestion detected.' };
            return { status: 'normal', message: 'Traffic flow is normal.' };
        }
    },
    farm: {
        id: 'dev_farm_01',
        domain: 'farm',
        generate: () => {
            const soil_moisture = Math.random() * 100;             // 0-100
            const light_intensity = Math.floor(Math.random() * 1200); // 0-1200
            const ph = 4 + Math.random() * 6;                      // 4-10
            return { soil_moisture: +soil_moisture.toFixed(1), light_intensity, ph: +ph.toFixed(1) };
        },
        evaluate: (m) => {
            if (m.soil_moisture < 20 || m.ph > 9) return { status: 'critical', message: '🌾 CRITICAL: Soil conditions dangerous for crops!' };
            if (m.soil_moisture < 30 || m.ph > 8) return { status: 'warning', message: '⚠️ Warning: Soil needs attention.' };
            return { status: 'normal', message: 'Farm conditions optimal.' };
        }
    }
};

const sendData = async (variantKey) => {
    const variant = VARIANTS[variantKey];
    if (!variant) return;

    const metrics = variant.generate();
    const { status, message } = variant.evaluate(metrics);

    const payload = {
        deviceId: variant.id,
        domain: variant.domain,
        metrics,
        status,
        message,
        timestamp: Date.now()
    };

    try {
        const res = await axios.post(API_URL, payload);
        const statusIcon = status === 'critical' ? '🔴' : status === 'warning' ? '🟡' : '🟢';
        console.log(`${statusIcon} [${variant.domain.toUpperCase()}] ${JSON.stringify(metrics)} → ${status}`);
    } catch (err) {
        console.error(`❌ [${variant.domain}] Error:`, err.message);
    }
};

// CLI argument: node index.js [variant|all] [interval_ms]
const mode = process.argv[2] || 'all';
const interval = parseInt(process.argv[3]) || 2000;

console.log(`\n🚀 IoT Simulator Started`);
console.log(`   Mode: ${mode} | Interval: ${interval}ms | Target: ${API_URL}\n`);

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
