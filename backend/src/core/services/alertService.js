const prisma = require('../utils/prisma');

class AlertService {
    /**
     * Get alerts with optional filters
     */
    async getAlerts(organizationId, domain, severity, unresolvedOnly, limit = 100) {
        const where = {};
        if (organizationId) where.organizationId = organizationId;
        if (severity) where.severity = severity;
        if (unresolvedOnly === 'true' || unresolvedOnly === true) where.resolvedAt = null;
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

        return alerts;
    }

    /**
     * Resolve an alert by ID
     */
    async resolveAlert(alertId) {
        const alert = await prisma.alert.update({
            where: { id: alertId },
            data: { resolvedAt: new Date() }
        });

        return alert;
    }
}

module.exports = new AlertService();
