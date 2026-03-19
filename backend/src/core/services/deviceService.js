const prisma = require('../utils/prisma');

class DeviceService {
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

        return devices;
    }

    /**
     * Get device by ID with sensor data and alerts
     */
    async getDeviceById(deviceId) {
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

        if (!device) {
            throw {
                status: 404,
                message: 'Device not found'
            };
        }

        return device;
    }

    /**
     * Update device information
     */
    async updateDevice(deviceId, name, description) {
        const device = await prisma.device.update({
            where: { id: deviceId },
            data: {
                name: name !== undefined ? name : undefined,
                description: description !== undefined ? description : undefined
            }
        });

        return device;
    }
}

module.exports = new DeviceService();
