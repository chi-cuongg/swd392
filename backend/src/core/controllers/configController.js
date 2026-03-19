const configService = require('../services/configService');

/**
 * Config Controller - handles HTTP request/response
 * Business logic is delegated to configService
 */

exports.getMetricSchema = async(req, res) => {
    try {
        const { domain } = req.query;
        const schema = configService.getMetricSchema(domain);
        res.json(schema);
    } catch (error) {
        console.error('Get metric schema error:', error);
        const status = error.status || 500;
        const message = error.message || 'Failed to fetch metric schema';
        res.status(status).json({ error: message });
    }
};

exports.getOrganizations = async(req, res) => {
    try {
        const organizations = await configService.getOrganizations();
        res.json(organizations);
    } catch (error) {
        console.error('Get organizations error:', error);
        const status = error.status || 500;
        const message = error.message || 'Failed to fetch organizations';
        res.status(status).json({ error: message });
    }
};

exports.getVariants = async(req, res) => {
    try {
        const { organizationId } = req.query;
        const variants = await configService.getVariants(organizationId);
        res.json(variants);
    } catch (error) {
        console.error('Get variants error:', error);
        const status = error.status || 500;
        const message = error.message || 'Failed to fetch variants';
        res.status(status).json({ error: message });
    }
};

exports.getVariantById = async(req, res) => {
    try {
        const { id } = req.params;
        const { organizationId } = req.query;
        const variant = await configService.getVariantById(id, organizationId);
        res.json(variant);
    } catch (error) {
        console.error('Get variant error:', error);
        const status = error.status || 500;
        const message = error.message || 'Failed to fetch variant';
        res.status(status).json({ error: message });
    }
};
