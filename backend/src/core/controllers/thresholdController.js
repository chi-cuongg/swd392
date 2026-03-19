const thresholdService = require('../services/thresholdService');
const { isSystemAdmin } = require('../utils/roleUtils');

/**
 * Threshold Controller - handles HTTP request/response
 * Business logic is delegated to thresholdService
 */

exports.getThresholds = async(req, res) => {
    try {
        const { domain } = req.query;
        const organizationId = isSystemAdmin(req.userRole)
            ? (req.query.organizationId || req.organizationId)
            : req.organizationId;
        const thresholds = await thresholdService.getThresholds(organizationId, domain);
        res.json(thresholds);
    } catch (error) {
        console.error('Get thresholds error:', error);
        const status = error.status || 500;
        const message = error.message || 'Failed to fetch thresholds';
        res.status(status).json({ error: message });
    }
};

exports.updateThreshold = async(req, res) => {
    try {
        const { metricId } = req.params;
        const { warn, critical, invertWarning, valueMapping } = req.body;
        const organizationId = isSystemAdmin(req.userRole)
            ? (req.query.organizationId || req.organizationId)
            : req.organizationId;
        const threshold = await thresholdService.updateThreshold(
            metricId,
            organizationId,
            warn,
            critical,
            invertWarning,
            valueMapping
        );
        res.json(threshold);
    } catch (error) {
        console.error('Update threshold error:', error);
        const status = error.status || 500;
        const message = error.message || 'Failed to update threshold';
        res.status(status).json({ error: message });
    }
};
