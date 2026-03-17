const express = require('express');
const router = express.Router();
const prisma = require('../utils/prisma');

// Get all devices
router.get('/', async (req, res) => {
    try {
        const { organizationId, domain } = req.query;
        const where = {};
        if (organizationId) where.organizationId = organizationId;
        if (domain) where.domain = domain;

        const devices = await prisma.device.findMany({
            where,
            include: {
                sensorData: {
                    take: 10,
                    orderBy: { timestamp: 'desc' },
                    include: { metric: { select: { key: true, label: true, unit: true } } }
                }
            }
        });
        res.json(devices);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch devices' });
    }
});

// Get device by ID
router.get('/:id', async (req, res) => {
    try {
        const device = await prisma.device.findUnique({
            where: { id: req.params.id },
            include: {
                sensorData: {
                    take: 50,
                    orderBy: { timestamp: 'desc' },
                    include: { metric: { select: { key: true, label: true, unit: true } } }
                },
                alerts: {
                    take: 20,
                    orderBy: { createdAt: 'desc' }
                }
            }
        });
        if (!device) return res.status(404).json({ error: 'Device not found' });
        res.json(device);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch device' });
    }
});

module.exports = router;
