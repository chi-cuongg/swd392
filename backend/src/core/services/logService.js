const prisma = require('../utils/prisma');

class LogService {
    /**
     * Get sensor logs with optional filters
     */
    async getLogs(deviceId, organizationId, domain, level, limit = 100) {
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
            take: parseInt(limit, 10),
            include: {
                device: { select: { name: true, domain: true, organizationId: true } },
                metric: { select: { key: true, label: true, unit: true } }
            }
        });

        return logs;
    }

    /**
     * Get aggregated statistics for logs and alerts
     */
    async getStats(organizationId) {
        const deviceWhere = organizationId ? { organizationId } : {};
        const alertWhere = organizationId ? { organizationId } : {};

        const [total, critical, warning, devices, onlineDevices] = await Promise.all([
            prisma.sensorData.count({
                where: organizationId ? { device: { organizationId } } : {}
            }),
            prisma.alert.count({ where: { ...alertWhere, severity: 'critical' } }),
            prisma.alert.count({ where: { ...alertWhere, severity: 'warning' } }),
            prisma.device.count({ where: deviceWhere }),
            prisma.device.count({ where: { ...deviceWhere, status: 'online' } })
        ]);

        return {
            totalLogs: total,
            criticalAlerts: critical,
            warnings: warning,
            totalDevices: devices,
            onlineDevices
        };
    }
}

module.exports = new LogService();
