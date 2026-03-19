const deviceService = require('../services/deviceService');

/**
 * Device Controller - handles HTTP request/response
 * Business logic is delegated to deviceService
 */

exports.getAllDevices = async(req, res) => {
    try {
        const { organizationId, domain } = req.query;
        const devices = await deviceService.getAllDevices(organizationId, domain);
        res.json(devices);
    } catch (error) {
        console.error('Get devices error:', error);
        const status = error.status || 500;
        const message = error.message || 'Failed to fetch devices';
        res.status(status).json({ error: message });
    }
};

exports.getDeviceById = async(req, res) => {
    try {
        const device = await deviceService.getDeviceById(req.params.id);
        res.json(device);
    } catch (error) {
        console.error('Get device error:', error);
        const status = error.status || 500;
        const message = error.message || 'Failed to fetch device';
        res.status(status).json({ error: message });
    }
};

exports.updateDevice = async(req, res) => {
    try {
        const { name, description } = req.body;
        const device = await deviceService.updateDevice(req.params.id, name, description);
        res.json(device);
    } catch (error) {
        console.error('Update device error:', error);
        const status = error.status || 500;
        const message = error.message || 'Failed to update device';
        res.status(status).json({ error: message });
    }
};
