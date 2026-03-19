const prisma = require('../utils/prisma');
const jwt = require('jsonwebtoken');
const { getMetricSchema } = require('../utils/metricSchema');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

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

    async getMyOrganization(token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            const organization = await prisma.organization.findUnique({ 
                where: { id: decoded.organizationId },
                select: { id: true, slug: true, name: true, description: true }
            });
            return organization;
        } catch (error) {
            throw {
                status: 401,
                message: 'Invalid or expired token'
            };
        }
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

        const dashboard = await prisma.dashboardConfig.findUnique({
            where: {
                organizationId_domain: {
                    organizationId,
                    domain
                }
            }
        });

        if (!dashboard) {
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
            id: dashboard.domain,
            organizationId,
            label: dashboard.label,
            description: dashboard.description,
            icon: dashboard.icon,
            color: dashboard.color,
            widgets: JSON.parse(dashboard.widgets),
            thresholds
        };
    }
}

module.exports = new ConfigService();
