const alertService = require('../services/alertService');

/**
 * Alert Controller - handles HTTP request/response
 * Business logic is delegated to alertService
 */

exports.getAlerts = async(req, res) => {
    try {
        const { organizationId, domain, severity, unresolvedOnly, limit } = req.query;
        const alerts = await alertService.getAlerts(
            organizationId,
            domain,
            severity,
            unresolvedOnly,
            limit
        );
        res.json(alerts);
    } catch (error) {
        console.error('Get alerts error:', error);
        const status = error.status || 500;
        const message = error.message || 'Failed to fetch alerts';
        res.status(status).json({ error: message });
    }
};

exports.resolveAlert = async(req, res) => {
    try {
        const alert = await alertService.resolveAlert(req.params.id);
        res.json(alert);
    } catch (error) {
        console.error('Resolve alert error:', error);
        const status = error.status || 500;
        const message = error.message || 'Failed to resolve alert';
        res.status(status).json({ error: message });
    }
};
