const express = require('express');
const router = express.Router();
const prisma = require('../utils/prisma');

// GET /api/logs?deviceId=xxx&limit=50
router.get('/', async (req, res) => {
    try {
        const { deviceId, organizationId, domain, limit = 100, level } = req.query;
        const where = {};
        if (deviceId) where.deviceId = deviceId;
        if (level) where.status = level;
        if (organizationId || domain) {
            where.device = {};
            if (organizationId) where.device.organizationId = organizationId;
            if (domain) where.device.domain = domain;
        }

        const logs = await prisma.sensorData.findMany({
            where,
            orderBy: { timestamp: 'desc' },
            take: parseInt(limit),
            include: {
                device: { select: { name: true, domain: true, organizationId: true } },
                metric: { select: { key: true, label: true, unit: true } }
            }
        });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
});

// GET /api/logs/stats — aggregated stats
router.get('/stats', async (req, res) => {
    try {
        const { organizationId } = req.query;
        const deviceWhere = organizationId ? { organizationId } : {};
        const alertWhere = organizationId ? { organizationId } : {};

        const total = await prisma.sensorData.count({
            where: organizationId ? { device: { organizationId } } : {}
        });
        const critical = await prisma.alert.count({ where: { ...alertWhere, severity: 'critical' } });
        const warning = await prisma.alert.count({ where: { ...alertWhere, severity: 'warning' } });
        const devices = await prisma.device.count({ where: deviceWhere });
        const onlineDevices = await prisma.device.count({ where: { ...deviceWhere, status: 'online' } });

        res.json({ totalLogs: total, criticalAlerts: critical, warnings: warning, totalDevices: devices, onlineDevices });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

module.exports = router;
