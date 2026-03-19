const logService = require('../services/logService');
const { isSystemAdmin } = require('../utils/roleUtils');

/**
 * Log Controller - handles HTTP request/response
 * Business logic is delegated to logService
 */

exports.getLogs = async(req, res) => {
    try {
        const { deviceId, domain, level, limit } = req.query;
        const organizationId = isSystemAdmin(req.userRole)
            ? (req.query.organizationId || req.organizationId)
            : req.organizationId;
        const logs = await logService.getLogs(deviceId, organizationId, domain, level, limit);
        res.json(logs);
    } catch (error) {
        console.error('Get logs error:', error);
        const status = error.status || 500;
        const message = error.message || 'Failed to fetch logs';
        res.status(status).json({ error: message });
    }
};

exports.getStats = async(req, res) => {
    try {
        const organizationId = isSystemAdmin(req.userRole)
            ? (req.query.organizationId || req.organizationId)
            : req.organizationId;
        const stats = await logService.getStats(organizationId);
        res.json(stats);
    } catch (error) {
        console.error('Get stats error:', error);
        const status = error.status || 500;
        const message = error.message || 'Failed to fetch stats';
        res.status(status).json({ error: message });
    }
};
