const prisma = require('../utils/prisma');
const { getMetricSchema, getAllDomains, getDomain } = require('../../domains/registry');

class ConfigService {
    /**
     * Get metric schema by domain or all domains
     */
    getMetricSchema(domain) {
        if (domain) {
            const schema = getMetricSchema(domain);
            if (!schema.keys || schema.keys.length === 0) {
                throw {
                    status: 404,
                    message: 'Domain schema not found'
                };
            }
            return schema;
        }
        return getMetricSchema();
    }

    /**
     * Get all organizations
     */
    async getOrganizations() {
        const organizations = await prisma.organization.findMany({
            select: { id: true, slug: true, name: true, description: true },
            orderBy: { name: 'asc' }
        });
        return organizations;
    }

    /**
     * Get all dashboard variants/configs from domains
     */
    async getVariants(organizationId) {
        const where = organizationId ? { organizationId } : {};
        const variants = await prisma.dashboardConfig.findMany({
            where,
            select: {
                domain: true,
                label: true,
                description: true,
                icon: true,
                color: true,
                organizationId: true
            },
            orderBy: { domain: 'asc' }
        });
        
        return Object.values(variants).map(v => ({
            id: v.domain,
            label: v.label,
            description: v.description,
            icon: v.icon,
            color: v.color,
            organizationId: v.organizationId
        }));
    }

    /**
     * Get specific variant configuration with metrics and thresholds
     */
    async getVariantById(domain, organizationId) {
        if (!organizationId) {
            throw {
                status: 400,
                message: 'organizationId is required'
            };
        }

        const domainConfig = getDomain(domain);
        if (!domainConfig) {
            throw {
                status: 404,
                message: 'Variant not found'
            };
        }

        // Get metrics with thresholds from database (for organization-specific overrides)
        const metrics = await prisma.metric.findMany({
            where: { organizationId, domain },
            include: { threshold: true }
        });

        // Build thresholds map - use database values if available, otherwise use domain defaults
        const thresholds = {};
        for (const metric of metrics) {
            thresholds[metric.key] = {
                warn: metric.threshold?.warn ?? null,
                critical: metric.threshold?.critical ?? null,
                unit: metric.unit,
                invertWarning: metric.threshold?.invertWarning || false,
                values: metric.threshold?.valueMapping ? JSON.parse(metric.threshold.valueMapping) : undefined
            };
        }

        return {
            id: domainConfig.id,
            organizationId,
            label: domainConfig.label,
            description: domainConfig.description,
            icon: domainConfig.icon,
            color: domainConfig.color,
            widgets: domainConfig.widgets,
            thresholds: thresholds.length > 0 ? thresholds : domainConfig.thresholds
        };
    }
}

module.exports = new ConfigService();
