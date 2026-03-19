const deviceService = require('../services/deviceService');
const { isSystemAdmin } = require('../utils/roleUtils');

/**
 * Device Controller - handles HTTP request/response
 * Business logic is delegated to deviceService
 */

exports.getAllDevices = async(req, res) => {
    try {
        const { domain } = req.query;
        const organizationId = isSystemAdmin(req.userRole)
            ? (req.query.organizationId || req.organizationId)
            : req.organizationId;
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
        const organizationId = isSystemAdmin(req.userRole)
            ? (req.query.organizationId || req.organizationId)
            : req.organizationId;
        const device = await deviceService.getDeviceById(req.params.id, organizationId);
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
        const organizationId = isSystemAdmin(req.userRole)
            ? (req.query.organizationId || req.organizationId)
            : req.organizationId;
        const device = await deviceService.updateDevice(req.params.id, organizationId, name, description);
        res.json(device);
    } catch (error) {
        console.error('Update device error:', error);
        const status = error.status || 500;
        const message = error.message || 'Failed to update device';
        res.status(status).json({ error: message });
    }
};

exports.createDevice = async(req, res) => {
    try {
        const bodyOrganizationId = req.body.organizationId;
        const organizationId = isSystemAdmin(req.userRole)
            ? (bodyOrganizationId || req.organizationId)
            : req.organizationId;

        const device = await deviceService.createDevice({
            ...req.body,
            organizationId
        });
        res.status(201).json(device);
    } catch (error) {
        console.error('Create device error:', error);
        const status = error.status || 500;
        const message = error.message || 'Failed to create device';
        res.status(status).json({ error: message });
    }
};

exports.deleteDevice = async(req, res) => {
    try {
        const organizationId = isSystemAdmin(req.userRole)
            ? (req.query.organizationId || req.organizationId)
            : req.organizationId;
        const result = await deviceService.deleteDevice(req.params.id, organizationId);
        res.json(result);
    } catch (error) {
        console.error('Delete device error:', error);
        const status = error.status || 500;
        const message = error.message || 'Failed to delete device';
        res.status(status).json({ error: message });
    }
};
