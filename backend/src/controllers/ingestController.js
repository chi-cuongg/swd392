const prisma = require('../utils/prisma');

function evaluateSeverity(value, threshold) {
    if (!threshold || typeof value !== 'number') return 'normal';
    if (threshold.invertWarning) {
        if (typeof threshold.critical === 'number' && value <= threshold.critical) return 'critical';
        if (typeof threshold.warn === 'number' && value <= threshold.warn) return 'warning';
        return 'normal';
    }
    if (typeof threshold.critical === 'number' && value >= threshold.critical) return 'critical';
    if (typeof threshold.warn === 'number' && value >= threshold.warn) return 'warning';
    return 'normal';
}

function mergeSeverity(current, next) {
    const rank = { normal: 0, warning: 1, critical: 2 };
    return rank[next] > rank[current] ? next : current;
}

exports.ingestData = async (req, res) => {
    try {
        const { organizationId: rawOrganizationId, deviceId, domain, metrics, status, message } = req.body;

        if (!deviceId || !domain || !metrics || typeof metrics !== 'object') {
            return res.status(400).json({
                success: false,
                error: 'deviceId, domain and metrics are required'
            });
        }

        const organization = rawOrganizationId
            ? await prisma.organization.findUnique({ where: { id: rawOrganizationId } })
            : await prisma.organization.findUnique({ where: { slug: domain } });
        if (!organization) {
            return res.status(404).json({ success: false, error: 'Organization not found' });
        }
        const organizationId = organization.id;

        const device = await prisma.device.upsert({
            where: { id: deviceId },
            update: {
                status: 'online',
                domain,
                organizationId,
                updatedAt: new Date()
            },
            create: {
                id: deviceId,
                organizationId,
                name: `Device ${deviceId}`,
                type: 'Generic',
                domain,
                status: 'online'
            }
        });

        let overallStatus = status || 'normal';
        const createdAlerts = [];
        const metricEntries = Object.entries(metrics);

        for (const [metricKey, metricRawValue] of metricEntries) {
            const valueNumber = typeof metricRawValue === 'number' ? metricRawValue : Number(metricRawValue);
            const isNumeric = !Number.isNaN(valueNumber);

            const metric = await prisma.metric.upsert({
                where: {
                    organizationId_domain_key: {
                        organizationId,
                        domain,
                        key: metricKey
                    }
                },
                update: {},
                create: {
                    organizationId,
                    domain,
                    key: metricKey,
                    label: metricKey,
                    dataType: isNumeric ? 'number' : 'text'
                }
            });

            const threshold = await prisma.threshold.findUnique({ where: { metricId: metric.id } });
            const severity = status || evaluateSeverity(isNumeric ? valueNumber : undefined, threshold);
            overallStatus = mergeSeverity(overallStatus, severity);

            await prisma.sensorData.create({
                data: {
                    deviceId: device.id,
                    metricId: metric.id,
                    valueNumber: isNumeric ? valueNumber : null,
                    valueText: isNumeric ? null : String(metricRawValue),
                    status: severity
                }
            });

            if (severity === 'critical' || severity === 'warning') {
                const alert = await prisma.alert.create({
                    data: {
                        organizationId,
                        deviceId: device.id,
                        metricId: metric.id,
                        severity,
                        value: isNumeric ? valueNumber : null,
                        message: message || `${metric.label} is ${severity}`
                    },
                    include: {
                        metric: { select: { key: true, label: true } }
                    }
                });
                createdAlerts.push(alert);
            }
        }

        const payload = {
            organizationId,
            deviceId,
            domain,
            metrics,
            status: overallStatus,
            message: message || '',
            timestamp: new Date().toISOString()
        };

        const orgRoom = `org:${organizationId}`;
        const domainRoom = `org:${organizationId}:domain:${domain}`;
        req.io.to(orgRoom).emit('device_update', payload);
        req.io.to(domainRoom).emit('device_update', payload);
        req.io.emit('device_update', payload);

        if (createdAlerts.length > 0) {
            req.io.to(orgRoom).emit('alert_created', createdAlerts);
            req.io.to(domainRoom).emit('alert_created', createdAlerts);
        }

        res.status(200).json({
            success: true,
            organizationId,
            deviceId,
            domain,
            status: overallStatus,
            alertCount: createdAlerts.length
        });
    } catch (error) {
        console.error('Ingest Error:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};
