const prisma = require('../utils/prisma');
const { DOMAIN_METRIC_KEYS, normalizeMetricKey } = require('../utils/metricSchema');

function parseDeviceConfig(rawConfig) {
    if (!rawConfig) return {};
    if (typeof rawConfig === 'object') return rawConfig;
    try {
        const parsed = JSON.parse(rawConfig);
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (error) {
        return {};
    }
}

function normalizeMetricKeys(domain, metricKeys) {
    if (!Array.isArray(metricKeys)) return [];
    const keys = [];
    const invalidMetricKeys = [];

    for (const item of metricKeys) {
        const rawKey = String(item || '').trim();
        if (!rawKey) continue;
        const canonicalKey = normalizeMetricKey(domain, rawKey);
        if (!canonicalKey) {
            invalidMetricKeys.push(rawKey);
            continue;
        }
        if (!keys.includes(canonicalKey)) {
            keys.push(canonicalKey);
        }
    }

    if (invalidMetricKeys.length > 0) {
        throw {
            status: 400,
            message: 'Invalid metric key(s) for domain',
            details: {
                invalidMetricKeys,
                allowedMetricKeys: Array.from(DOMAIN_METRIC_KEYS[domain] || [])
            }
        };
    }

    return keys;
}

function withParsedDeviceConfig(device) {
    const config = parseDeviceConfig(device.config);
    return {
        ...device,
        config,
        metricKeys: Array.isArray(config.metricKeys) ? config.metricKeys : []
    };
}

class DeviceService {
    /**
     * Create a device in an organization/domain scope
     */
    async createDevice(payload) {
        const { id, name, organizationId, domain, type, config, metricKeys } = payload;

        if (!id || !organizationId || !domain) {
            throw {
                status: 400,
                message: 'id, organizationId and domain are required'
            };
        }

        const organization = await prisma.organization.findUnique({ where: { id: organizationId } });
        if (!organization) {
            throw {
                status: 404,
                message: 'Organization not found'
            };
        }

        const variant = await prisma.dashboardConfig.findUnique({
            where: {
                organizationId_domain: {
                    organizationId,
                    domain
                }
            },
            select: { id: true }
        });

        if (!variant) {
            throw {
                status: 400,
                message: 'Domain is not configured for this organization'
            };
        }

        const existing = await prisma.device.findUnique({ where: { id } });
        if (existing) {
            throw {
                status: 409,
                message: 'Device ID already exists'
            };
        }

        const parsedConfig = parseDeviceConfig(config);
        const normalizedMetricKeys = normalizeMetricKeys(domain, metricKeys);
        const mergedConfig = {
            ...parsedConfig,
            metricKeys: normalizedMetricKeys
        };

        const device = await prisma.device.create({
            data: {
                id,
                organizationId,
                name: name || `Device ${id}`,
                type: type || 'Generic',
                domain,
                status: 'offline',
                config: JSON.stringify(mergedConfig)
            }
        });

        return withParsedDeviceConfig(device);
    }

    /**
     * Get all devices with optional filters
     */
    async getAllDevices(organizationId, domain) {
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

        return devices.map(withParsedDeviceConfig);
    }

    /**
     * Get device by ID with sensor data and alerts
     */
    async getDeviceById(deviceId, organizationId) {
        const device = await prisma.device.findUnique({
            where: { id: deviceId },
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

        if (!device || device.organizationId !== organizationId) {
            throw {
                status: 404,
                message: 'Device not found'
            };
        }

        return withParsedDeviceConfig(device);
    }

    /**
     * Update device information
     */
    async updateDevice(deviceId, organizationId, name, description) {
        const existing = await prisma.device.findUnique({ where: { id: deviceId } });
        if (!existing || existing.organizationId !== organizationId) {
            throw {
                status: 404,
                message: 'Device not found'
            };
        }

        const device = await prisma.device.update({
            where: { id: deviceId },
            data: {
                name: name !== undefined ? name : undefined
            }
        });

        return device;
    }

    /**
     * Delete a device within an organization scope
     */
    async deleteDevice(deviceId, organizationId) {
        const device = await prisma.device.findUnique({ where: { id: deviceId } });
        if (!device || device.organizationId !== organizationId) {
            throw {
                status: 404,
                message: 'Device not found'
            };
        }

        await prisma.device.delete({ where: { id: deviceId } });

        return { success: true, id: deviceId };
    }
}

module.exports = new DeviceService();
