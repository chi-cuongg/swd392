const prisma = require('../utils/prisma');
const { DOMAIN_METRIC_KEYS, normalizeMetricKey } = require('../../domains/registry');

class IngestService {
    /**
     * Evaluate severity based on metric value and threshold
     */
    evaluateSeverity(value, threshold) {
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

    /**
     * Merge severities, returning the higher severity
     */
    mergeSeverity(current, next) {
        const rank = { normal: 0, warning: 1, critical: 2 };
        return rank[next] > rank[current] ? next : current;
    }

    /**
     * Normalize and validate metrics for a domain
     */
    normalizeMetrics(domain, metrics) {
        const normalizedMetrics = {};
        const invalidMetricKeys = [];

        for (const [rawKey, metricValue] of Object.entries(metrics)) {
            const canonicalKey = normalizeMetricKey(domain, rawKey);
            if (!canonicalKey) {
                invalidMetricKeys.push(rawKey);
                continue;
            }
            normalizedMetrics[canonicalKey] = metricValue;
        }

        if (invalidMetricKeys.length > 0) {
            const allowed = Array.from(DOMAIN_METRIC_KEYS[domain] || []);
            throw {
                status: 400,
                message: 'Invalid metric key(s) for domain',
                details: {
                    invalidMetricKeys,
                    allowedMetricKeys: allowed
                }
            };
        }

        if (Object.keys(normalizedMetrics).length === 0) {
            throw {
                status: 400,
                message: 'No valid metrics after normalization'
            };
        }

        return normalizedMetrics;
    }

    /**
     * Find organization by ID or slug
     */
    async findOrganization(organizationId, organizationSlug) {
        const organization = organizationId
            ? await prisma.organization.findUnique({ where: { id: organizationId } })
            : await prisma.organization.findUnique({ where: { slug: organizationSlug } });

        if (!organization) {
            throw {
                status: 404,
                message: 'Organization not found'
            };
        }

        return organization;
    }

    /**
     * Upsert device and update its status
     */
    async upsertDevice(deviceId, organizationId, domain, deviceName) {
        const device = await prisma.device.upsert({
            where: { id: deviceId },
            update: {
                status: 'online',
                domain,
                organizationId,
                name: deviceName || undefined,
                updatedAt: new Date()
            },
            create: {
                id: deviceId,
                organizationId,
                name: deviceName || `Device ${deviceId}`,
                type: 'Generic',
                domain,
                status: 'online'
            }
        });

        return device;
    }

    /**
     * Process a single metric and create sensor data
     */
    async processMetric(organizationId, deviceId, domain, metricKey, metricValue) {
        const valueNumber = typeof metricValue === 'number' ? metricValue : Number(metricValue);
        const isNumeric = !Number.isNaN(valueNumber);

        // Upsert metric
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

        // Get threshold and evaluate severity
        const threshold = await prisma.threshold.findUnique({ where: { metricId: metric.id } });
        const severity = this.evaluateSeverity(isNumeric ? valueNumber : undefined, threshold);

        // Create sensor data
        await prisma.sensorData.create({
            data: {
                deviceId,
                metricId: metric.id,
                valueNumber: isNumeric ? valueNumber : null,
                valueText: isNumeric ? null : String(metricValue),
                status: severity
            }
        });

        return { metric, severity };
    }

    /**
     * Create alert if severity is warning or critical
     */
    async createAlertIfNeeded(organizationId, deviceId, metric, severity, value, message) {
        if (severity === 'critical' || severity === 'warning') {
            const alert = await prisma.alert.create({
                data: {
                    organizationId,
                    deviceId,
                    metricId: metric.id,
                    severity,
                    value: typeof value === 'number' ? value : null,
                    message: message || `${metric.label} is ${severity}`
                },
                include: {
                    metric: { select: { key: true, label: true } }
                }
            });
            return alert;
        }
        return null;
    }

    /**
     * Ingest data from a device
     */
    async ingestData(organizationId, organizationSlug, deviceId, deviceName, domain, metrics, status, message) {
        // Validate inputs
        if (!deviceId || !domain || !metrics || typeof metrics !== 'object') {
            throw {
                status: 400,
                message: 'deviceId, domain and metrics are required'
            };
        }

        // Find organization
        const organization = await this.findOrganization(organizationId, organizationSlug);
        const orgId = organization.id;

        // Normalize and validate metrics
        const normalizedMetrics = this.normalizeMetrics(domain, metrics);

        // Upsert device
        const device = await this.upsertDevice(deviceId, orgId, domain, deviceName);

        // Process all metrics
        let overallStatus = status || 'normal';
        const createdAlerts = [];

        for (const [metricKey, metricRawValue] of Object.entries(normalizedMetrics)) {
            const { metric, severity } = await this.processMetric(
                orgId,
                device.id,
                domain,
                metricKey,
                metricRawValue
            );

            overallStatus = this.mergeSeverity(overallStatus, severity);

            // Create alert if needed
            const valueNumber = typeof metricRawValue === 'number' ? metricRawValue : Number(metricRawValue);
            const alert = await this.createAlertIfNeeded(
                orgId,
                device.id,
                metric,
                severity,
                valueNumber,
                message
            );

            if (alert) {
                createdAlerts.push(alert);
            }
        }

        return {
            organizationId: orgId,
            deviceId,
            device,
            domain,
            metrics: normalizedMetrics,
            status: overallStatus,
            message: message || '',
            timestamp: new Date().toISOString(),
            alerts: createdAlerts
        };
    }
}

module.exports = new IngestService();
