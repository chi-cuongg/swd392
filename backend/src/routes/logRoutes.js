const express = require('express');
const router = express.Router();
const prisma = require('../utils/prisma');

// GET /api/logs?deviceId=xxx&limit=50
router.get('/', async (req, res) => {
    try {
        const { deviceId, limit = 100, level } = req.query;
        const where = {};
        if (deviceId) where.deviceId = deviceId;
        if (level) where.level = level;

        const logs = await prisma.log.findMany({
            where,
            orderBy: { timestamp: 'desc' },
            take: parseInt(limit),
            include: { device: { select: { name: true, variant: true } } }
        });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
});

// GET /api/logs/stats — aggregated stats
router.get('/stats', async (req, res) => {
    try {
        const total = await prisma.log.count();
        const critical = await prisma.log.count({ where: { level: 'critical' } });
        const warning = await prisma.log.count({ where: { level: 'warning' } });
        const devices = await prisma.device.count();
        const onlineDevices = await prisma.device.count({ where: { status: 'online' } });

        res.json({ totalLogs: total, criticalAlerts: critical, warnings: warning, totalDevices: devices, onlineDevices });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

module.exports = router;
