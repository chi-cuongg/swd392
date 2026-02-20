const prisma = require('../utils/prisma');

exports.ingestData = async (req, res) => {
    try {
        const { deviceId, domain, metrics, status, message } = req.body;

        // 1. Check if device exists, if not create/update it
        // In a real scenario, we might want strict registration, but for SPLA demo dynamic is fine
        const device = await prisma.device.upsert({
            where: { id: deviceId },
            update: {
                status: 'online',
                variant: domain,
                updatedAt: new Date()
            },
            create: {
                id: deviceId,
                name: `Device ${deviceId}`,
                type: 'Generic',
                variant: domain,
                status: 'online'
            }
        });

        // 2. Save Log
        const log = await prisma.log.create({
            data: {
                deviceId: device.id,
                data: JSON.stringify(metrics),
                level: status === 'critical' ? 'critical' : status === 'warning' ? 'warning' : 'info',
                message: message || ''
            }
        });

        // 3. Emit Real-time Event
        // Broadcast to specific domain room or general
        req.io.emit('device_update', {
            deviceId,
            domain,
            metrics,
            status,
            message,
            timestamp: log.timestamp
        });

        res.status(200).json({ success: true, logId: log.id });
    } catch (error) {
        console.error('Ingest Error:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};
