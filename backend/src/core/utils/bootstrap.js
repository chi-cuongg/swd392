const { getAllDomains } = require('../../domains/registry');

async function ensureDefaultData(prisma) {
    const orgCount = await prisma.organization.count();
    if (orgCount > 0) return;

    const domains = getAllDomains();

    for (const variant of Object.values(domains)) {
        await prisma.organization.create({
            data: {
                id: variant.organizationId,
                slug: variant.id,
                name: variant.organizationName,
                description: variant.description,
                dashboards: {
                    create: {
                        domain: variant.id,
                        label: variant.label,
                        description: variant.description,
                        icon: variant.icon,
                        color: variant.color,
                        widgets: JSON.stringify(variant.widgets)
                    }
                }
            }
        });

        const uniqueWidgetsByKey = new Map();
        for (const widget of variant.widgets) {
            if (!uniqueWidgetsByKey.has(widget.key)) {
                uniqueWidgetsByKey.set(widget.key, widget);
            }
        }

        for (const widget of uniqueWidgetsByKey.values()) {
            const threshold = variant.thresholds[widget.key] || {};
            const metric = await prisma.metric.upsert({
                where: {
                    organizationId_domain_key: {
                        organizationId: variant.organizationId,
                        domain: variant.id,
                        key: widget.key
                    }
                },
                update: {},
                create: {
                    organizationId: variant.organizationId,
                    domain: variant.id,
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

            await prisma.threshold.upsert({
                where: { metricId: metric.id },
                update: {
                    warn: typeof threshold.warn === 'number' ? threshold.warn : null,
                    critical: typeof threshold.critical === 'number' ? threshold.critical : null,
                    invertWarning: Boolean(threshold.invertWarning),
                    valueMapping: threshold.values ? JSON.stringify(threshold.values) : null
                },
                create: {
                    metricId: metric.id,
                    warn: typeof threshold.warn === 'number' ? threshold.warn : null,
                    critical: typeof threshold.critical === 'number' ? threshold.critical : null,
                    invertWarning: Boolean(threshold.invertWarning),
                    valueMapping: threshold.values ? JSON.stringify(threshold.values) : null
                }
            });
        }
    }

    const adminOrgId = 'org_home';
    const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@spla.local';
    const existingAdmin = await prisma.user.findFirst({
        where: { organizationId: adminOrgId, email: adminEmail }
    });

    if (!existingAdmin) {
        const bcrypt = require('bcryptjs');
        const hashed = await bcrypt.hash(process.env.DEFAULT_ADMIN_PASSWORD || 'admin123', 10);
        await prisma.user.create({
            data: {
                organizationId: adminOrgId,
                email: adminEmail,
                password: hashed,
                name: 'Platform Admin',
                role: 'admin'
            }
        });
    }
}

module.exports = { ensureDefaultData };