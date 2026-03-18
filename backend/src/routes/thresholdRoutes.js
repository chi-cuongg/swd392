const express = require('express');
const router = express.Router();
const prisma = require('../utils/prisma');
const authMiddleware = require('../utils/authMiddleware');
const adminMiddleware = require('../utils/adminMiddleware');

router.use(authMiddleware, adminMiddleware);

router.get('/', async(req, res) => {
    try {
        const { organizationId, domain } = req.query;
        const where = {};
        if (organizationId) where.organizationId = organizationId;
        if (domain) where.domain = domain;

        const metrics = await prisma.metric.findMany({
            where,
            include: { threshold: true },
            orderBy: [{ domain: 'asc' }, { key: 'asc' }]
        });

        res.json(metrics.map((metric) => ({
            organizationId: metric.organizationId,
            domain: metric.domain,
            metricId: metric.id,
            key: metric.key,
            label: metric.label,
            unit: metric.unit,
            threshold: metric.threshold ?
                {
                    id: metric.threshold.id,
                    warn: metric.threshold.warn,
                    critical: metric.threshold.critical,
                    invertWarning: metric.threshold.invertWarning,
                    valueMapping: metric.threshold.valueMapping ? JSON.parse(metric.threshold.valueMapping) : null
                } :
                null
        })));
    } catch (error) {
        console.error('Failed to fetch thresholds:', error);
        res.status(500).json({ error: 'Failed to fetch thresholds' });
    }
});

router.put('/:metricId', async(req, res) => {
    try {
        const { metricId } = req.params;
        const { warn, critical, invertWarning = false, valueMapping } = req.body;

        const metric = await prisma.metric.findUnique({ where: { id: metricId } });
        if (!metric) return res.status(404).json({ error: 'Metric not found' });

        const threshold = await prisma.threshold.upsert({
            where: { metricId },
            update: {
                warn: typeof warn === 'number' ? warn : null,
                critical: typeof critical === 'number' ? critical : null,
                invertWarning: Boolean(invertWarning),
                valueMapping: valueMapping ? JSON.stringify(valueMapping) : null
            },
            create: {
                metricId,
                warn: typeof warn === 'number' ? warn : null,
                critical: typeof critical === 'number' ? critical : null,
                invertWarning: Boolean(invertWarning),
                valueMapping: valueMapping ? JSON.stringify(valueMapping) : null
            }
        });

        res.json(threshold);
    } catch (error) {
        console.error('Failed to update threshold:', error);
        res.status(500).json({ error: 'Failed to update threshold' });
    }
});

module.exports = router;