const express = require('express');
const router = express.Router();
const prisma = require('../utils/prisma');

router.get('/organizations', async (req, res) => {
    try {
        const organizations = await prisma.organization.findMany({
            select: { id: true, slug: true, name: true, description: true },
            orderBy: { name: 'asc' }
        });
        res.json(organizations);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch organizations' });
    }
});

router.get('/variants', async (req, res) => {
    try {
        const { organizationId } = req.query;
        const where = organizationId ? { organizationId } : {};
        const variants = await prisma.dashboardConfig.findMany({
            where,
            select: {
                domain: true,
                label: true,
                description: true,
                icon: true,
                color: true,
                organizationId: true
            },
            orderBy: { domain: 'asc' }
        });

        const summary = variants.map((v) => ({
            id: v.domain,
            label: v.label,
            description: v.description,
            icon: v.icon,
            color: v.color,
            organizationId: v.organizationId
        }));
        res.json(summary);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch variants' });
    }
});

router.get('/variants/:id', async (req, res) => {
    try {
        const { organizationId } = req.query;
        if (!organizationId) return res.status(400).json({ error: 'organizationId is required' });

        const dashboard = await prisma.dashboardConfig.findUnique({
            where: {
                organizationId_domain: {
                    organizationId,
                    domain: req.params.id
                }
            }
        });

        if (!dashboard) return res.status(404).json({ error: 'Variant not found' });

        const metrics = await prisma.metric.findMany({
            where: { organizationId, domain: req.params.id },
            include: { threshold: true }
        });

        const thresholds = {};
        for (const metric of metrics) {
            thresholds[metric.key] = {
                warn: metric.threshold?.warn ?? null,
                critical: metric.threshold?.critical ?? null,
                unit: metric.unit,
                invertWarning: metric.threshold?.invertWarning || false,
                values: metric.threshold?.valueMapping ? JSON.parse(metric.threshold.valueMapping) : undefined
            };
        }

        res.json({
            id: dashboard.domain,
            organizationId,
            label: dashboard.label,
            description: dashboard.description,
            icon: dashboard.icon,
            color: dashboard.color,
            widgets: JSON.parse(dashboard.widgets),
            thresholds
        });
    } catch (error) {
        console.error('Variant config error:', error);
        res.status(500).json({ error: 'Failed to fetch variant config' });
    }
});

module.exports = router;
