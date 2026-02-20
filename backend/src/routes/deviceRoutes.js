const express = require('express');
const router = express.Router();
const prisma = require('../utils/prisma');

// Get all devices
router.get('/', async (req, res) => {
    try {
        const devices = await prisma.device.findMany({
            include: { logs: { take: 1, orderBy: { timestamp: 'desc' } } }
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
            include: { logs: { take: 50, orderBy: { timestamp: 'desc' } } }
        });
        if (!device) return res.status(404).json({ error: 'Device not found' });
        res.json(device);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch device' });
    }
});

module.exports = router;
