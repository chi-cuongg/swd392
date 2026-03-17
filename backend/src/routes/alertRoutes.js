const express = require('express');
const router = express.Router();
const prisma = require('../utils/prisma');

router.get('/', async(req, res) => {
    try {
        const { organizationId, domain, severity, unresolvedOnly, limit = 100 } = req.query;
        const where = {};
        if (organizationId) where.organizationId = organizationId;
        if (severity) where.severity = severity;
        if (unresolvedOnly === 'true') where.resolvedAt = null;
        if (domain) {
            where.device = { domain };
        }

        const alerts = await prisma.alert.findMany({
            where,
            take: parseInt(limit, 10),
            orderBy: { createdAt: 'desc' },
            include: {
                device: { select: { id: true, name: true, domain: true } },
                metric: { select: { key: true, label: true, unit: true } }
            }
        });

        res.json(alerts);
    } catch (error) {
        console.error('Failed to fetch alerts:', error);
        res.status(500).json({ error: 'Failed to fetch alerts' });
    }
});

router.put('/:id/resolve', async(req, res) => {
    try {
        const alert = await prisma.alert.update({
            where: { id: req.params.id },
            data: { resolvedAt: new Date() }
        });
        res.json(alert);
    } catch (error) {
        console.error('Failed to resolve alert:', error);
        res.status(500).json({ error: 'Failed to resolve alert' });
    }
});

module.exports = router;