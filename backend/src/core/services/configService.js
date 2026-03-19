const prisma = require('../utils/prisma');
const { getMetricSchema } = require('../utils/metricSchema');
const { isSystemAdmin } = require('../utils/roleUtils');
const { getDomain } = require('../../domains/registry');
const bcrypt = require('bcryptjs');

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
    async getOrganizations(organizationId, userRole) {
        const where = isSystemAdmin(userRole) ? {} : { id: organizationId };
        const organizations = await prisma.organization.findMany({
            where,
            select: {
                id: true, slug: true, name: true, description: true, createdAt: true,
                dashboards: { select: { domain: true, label: true } }
            },
            orderBy: { name: 'asc' }
        });
        return organizations.map(org => ({
            ...org,
            domains: org.dashboards?.map(d => d.domain) || [],
            dashboards: undefined
        }));
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

    /**
     * Create a new organization and bootstrap domain defaults
     */
    async createOrganization(payload) {
        const {
            id,
            slug,
            name,
            description,
            domain,
            label,
            icon,
            color
        } = payload;

        if (!slug || !name || !domain) {
            throw {
                status: 400,
                message: 'slug, name and domain are required'
            };
        }

        const variant = getDomain(domain);
        if (!variant) {
            throw {
                status: 404,
                message: 'Domain not found'
            };
        }

        const orgId = id || `org_${slug}`;

        const existing = await prisma.organization.findFirst({
            where: {
                OR: [{ id: orgId }, { slug }]
            }
        });

        if (existing) {
            throw {
                status: 409,
                message: 'Organization already exists'
            };
        }

        const created = await prisma.organization.create({
            data: {
                id: orgId,
                slug,
                name,
                description: description || null,
                dashboards: {
                    create: {
                        domain,
                        label: label || variant.label,
                        description: variant.description,
                        icon: icon || variant.icon,
                        color: color || variant.color,
                        widgets: JSON.stringify(variant.widgets)
                    }
                }
            },
            select: { id: true, slug: true, name: true, description: true }
        });

        const uniqueWidgetsByKey = new Map();
        for (const widget of variant.widgets) {
            if (!uniqueWidgetsByKey.has(widget.key)) {
                uniqueWidgetsByKey.set(widget.key, widget);
            }
        }

        for (const widget of uniqueWidgetsByKey.values()) {
            const threshold = variant.thresholds[widget.key] || {};
            const metric = await prisma.metric.create({
                data: {
                    organizationId: created.id,
                    domain,
                    key: widget.key,
                    label: widget.label,
                    unit: widget.unit || null,
                    dataType: threshold.values ? 'enum' : 'number',
                    min: typeof widget.min === 'number' ? widget.min : null,
                    max: typeof widget.max === 'number' ? widget.max : null,
                    widgetType: widget.type,
                    icon: widget.icon || null
                }
            });

            await prisma.threshold.create({
                data: {
                    metricId: metric.id,
                    warn: typeof threshold.warn === 'number' ? threshold.warn : null,
                    critical: typeof threshold.critical === 'number' ? threshold.critical : null,
                    invertWarning: Boolean(threshold.invertWarning),
                    valueMapping: threshold.values ? JSON.stringify(threshold.values) : null
                }
            });
        }

        return created;
    }

    /**
     * Update organization metadata
     */
    async updateOrganization(organizationId, payload) {
        const organization = await prisma.organization.findUnique({ where: { id: organizationId } });
        if (!organization) {
            throw {
                status: 404,
                message: 'Organization not found'
            };
        }

        const nextSlug = typeof payload.slug === 'string' ? payload.slug.trim() : organization.slug;
        const nextName = typeof payload.name === 'string' ? payload.name.trim() : organization.name;
        const nextDescription = typeof payload.description === 'string' ? payload.description.trim() : organization.description;

        if (!nextSlug || !nextName) {
            throw {
                status: 400,
                message: 'slug and name are required'
            };
        }

        const slugExists = await prisma.organization.findFirst({
            where: {
                slug: nextSlug,
                NOT: { id: organizationId }
            },
            select: { id: true }
        });

        if (slugExists) {
            throw {
                status: 409,
                message: 'Organization slug already exists'
            };
        }

        return prisma.organization.update({
            where: { id: organizationId },
            data: {
                slug: nextSlug,
                name: nextName,
                description: nextDescription || null
            },
            select: { id: true, slug: true, name: true, description: true }
        });
    }

    /**
     * Get users in an organization
     */
    async getOrganizationUsers(organizationId) {
        const users = await prisma.user.findMany({
            where: { organizationId },
            select: { id: true, email: true, name: true, role: true, createdAt: true },
            orderBy: { createdAt: 'asc' }
        });

        return users;
    }

    /**
     * Add user to an organization
     */
    async addUserToOrganization(organizationId, payload) {
        const { email, password, name, role } = payload;

        if (!email || !password) {
            throw {
                status: 400,
                message: 'email and password are required'
            };
        }

        const organization = await prisma.organization.findUnique({ where: { id: organizationId } });
        if (!organization) {
            throw {
                status: 404,
                message: 'Organization not found'
            };
        }

        const allowedRoles = new Set(['SYSTEM_ADMIN', 'ORG_USER', 'admin', 'user']);
        if (role && !allowedRoles.has(role)) {
            throw {
                status: 400,
                message: 'Invalid role value'
            };
        }

        const existing = await prisma.user.findFirst({ where: { organizationId, email } });
        if (existing) {
            throw {
                status: 409,
                message: 'Email already exists in this organization'
            };
        }

        const hashed = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                organizationId,
                email,
                password: hashed,
                name: name || email.split('@')[0],
                role: role || 'ORG_USER'
            },
            select: { id: true, email: true, name: true, role: true, organizationId: true }
        });

        return user;
    }

    /**
     * Update user in an organization
     */
    async updateUserInOrganization(organizationId, userId, payload) {
        const { name, role } = payload;

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.organizationId !== organizationId) {
            throw {
                status: 404,
                message: 'User not found'
            };
        }

        const allowedRoles = new Set(['SYSTEM_ADMIN', 'ORG_USER', 'admin', 'user']);
        if (role && !allowedRoles.has(role)) {
            throw {
                status: 400,
                message: 'Invalid role value'
            };
        }

        const updated = await prisma.user.update({
            where: { id: userId },
            data: {
                name: name !== undefined ? name : user.name,
                role: role || user.role
            },
            select: { id: true, email: true, name: true, role: true, organizationId: true }
        });

        return updated;
    }

    /**
     * Remove user from an organization
     */
    async removeUserFromOrganization(organizationId, userId) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.organizationId !== organizationId) {
            throw {
                status: 404,
                message: 'User not found'
            };
        }

        await prisma.user.delete({ where: { id: userId } });
        return { success: true, id: userId };
    }

    /**
     * Delete organization and all related data (cascade)
     */
    async deleteOrganization(organizationId) {
        const organization = await prisma.organization.findUnique({ where: { id: organizationId } });
        if (!organization) {
            throw { status: 404, message: 'Organization not found' };
        }

        // Get all metric IDs and device IDs for this org
        const metrics = await prisma.metric.findMany({ where: { organizationId }, select: { id: true } });
        const metricIds = metrics.map(m => m.id);
        const devices = await prisma.device.findMany({ where: { organizationId }, select: { id: true } });
        const deviceIds = devices.map(d => d.id);

        // Cascade delete in correct order
        if (metricIds.length > 0) {
            await prisma.threshold.deleteMany({ where: { metricId: { in: metricIds } } });
        }
        if (deviceIds.length > 0) {
            await prisma.sensorData.deleteMany({ where: { deviceId: { in: deviceIds } } });
        }
        await prisma.alert.deleteMany({ where: { organizationId } });
        await prisma.metric.deleteMany({ where: { organizationId } });
        await prisma.device.deleteMany({ where: { organizationId } });
        await prisma.user.deleteMany({ where: { organizationId } });
        await prisma.dashboardConfig.deleteMany({ where: { organizationId } });
        await prisma.organization.delete({ where: { id: organizationId } });

        return { success: true, id: organizationId };
    }
}

module.exports = new ConfigService();
