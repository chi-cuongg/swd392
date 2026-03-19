const prisma = require('../utils/prisma');

class ThresholdService {
    /**
     * Get all thresholds
     */
    async getThresholds(organizationId, domain) {
        const where = {};
        if (organizationId) where.organizationId = organizationId;
        if (domain) where.domain = domain;

        const metrics = await prisma.metric.findMany({
            where,
            include: { threshold: true },
            orderBy: [{ domain: 'asc' }, { key: 'asc' }]
        });

        return metrics.map(metric => ({
            organizationId: metric.organizationId,
            domain: metric.domain,
            metricId: metric.id,
            key: metric.key,
            label: metric.label,
            unit: metric.unit,
            threshold: metric.threshold
                ? {
                    id: metric.threshold.id,
                    warn: metric.threshold.warn,
                    critical: metric.threshold.critical,
                    invertWarning: metric.threshold.invertWarning,
                    valueMapping: metric.threshold.valueMapping ? JSON.parse(metric.threshold.valueMapping) : null
                }
                : null
        }));
    }

    /**
     * Update or create threshold for a metric
     */
    async updateThreshold(metricId, warn, critical, invertWarning = false, valueMapping) {
        const metric = await prisma.metric.findUnique({ where: { id: metricId } });
        if (!metric) {
            throw {
                status: 404,
                message: 'Metric not found'
            };
        }

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

        return threshold;
    }
}

module.exports = new ThresholdService();
