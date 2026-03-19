const configService = require('../services/configService');
const { isSystemAdmin } = require('../utils/roleUtils');

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
        const organizations = await configService.getOrganizations(req.organizationId, req.userRole);
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
        const requestedOrganizationId = req.query.organizationId;
        const effectiveOrganizationId = isSystemAdmin(req.userRole)
            ? (requestedOrganizationId || req.organizationId)
            : req.organizationId;
        const variants = await configService.getVariants(effectiveOrganizationId);
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
        const requestedOrganizationId = req.query.organizationId;
        const effectiveOrganizationId = isSystemAdmin(req.userRole)
            ? (requestedOrganizationId || req.organizationId)
            : req.organizationId;
        const variant = await configService.getVariantById(id, effectiveOrganizationId);
        res.json(variant);
    } catch (error) {
        console.error('Get variant error:', error);
        const status = error.status || 500;
        const message = error.message || 'Failed to fetch variant';
        res.status(status).json({ error: message });
    }
};

exports.createOrganization = async(req, res) => {
    try {
        const organization = await configService.createOrganization(req.body || {});
        res.status(201).json(organization);
    } catch (error) {
        console.error('Create organization error:', error);
        const status = error.status || 500;
        const message = error.message || 'Failed to create organization';
        res.status(status).json({ error: message });
    }
};

exports.updateOrganization = async(req, res) => {
    try {
        const updated = await configService.updateOrganization(req.params.organizationId, req.body || {});
        res.json(updated);
    } catch (error) {
        console.error('Update organization error:', error);
        const status = error.status || 500;
        const message = error.message || 'Failed to update organization';
        res.status(status).json({ error: message });
    }
};

exports.getOrganizationUsers = async(req, res) => {
    try {
        const users = await configService.getOrganizationUsers(req.params.organizationId);
        res.json(users);
    } catch (error) {
        console.error('Get organization users error:', error);
        const status = error.status || 500;
        const message = error.message || 'Failed to fetch users';
        res.status(status).json({ error: message });
    }
};

exports.addUserToOrganization = async(req, res) => {
    try {
        const user = await configService.addUserToOrganization(req.params.organizationId, req.body || {});
        res.status(201).json(user);
    } catch (error) {
        console.error('Add user error:', error);
        const status = error.status || 500;
        const message = error.message || 'Failed to add user';
        res.status(status).json({ error: message });
    }
};

exports.removeUserFromOrganization = async(req, res) => {
    try {
        if (req.userId === req.params.userId) {
            return res.status(400).json({ error: 'Cannot remove current user' });
        }

        const result = await configService.removeUserFromOrganization(
            req.params.organizationId,
            req.params.userId
        );
        res.json(result);
    } catch (error) {
        console.error('Remove user error:', error);
        const status = error.status || 500;
        const message = error.message || 'Failed to remove user';
        res.status(status).json({ error: message });
    }
};

exports.deleteOrganization = async(req, res) => {
    try {
        const result = await configService.deleteOrganization(req.params.organizationId);
        res.json(result);
    } catch (error) {
        console.error('Delete organization error:', error);
        const status = error.status || 500;
        const message = error.message || 'Failed to delete organization';
        res.status(status).json({ error: message });
    }
};
