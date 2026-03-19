const { getAllDomains } = require('../../domains/registry');

const DOMAIN_METRIC_KEYS = Object.fromEntries(
    Object.entries(getAllDomains()).map(([domain, config]) => {
        const keys = new Set();
        (config.widgets || []).forEach((widget) => {
            if (widget && widget.key) {
                keys.add(widget.key);
            }
        });
        return [domain, keys];
    })
);

const DOMAIN_METRIC_ALIASES = Object.fromEntries(
    Object.entries(getAllDomains()).map(([domain, config]) => {
        return [domain, config.metricAliases || {}];
    })
);

function normalizeMetricKey(domain, rawKey) {
    const domainKeys = DOMAIN_METRIC_KEYS[domain];
    const key = String(rawKey || '').trim();
    if (!key) return null;

    if (!domainKeys || domainKeys.size === 0) {
        return key;
    }

    if (domainKeys.has(key)) {
        return key;
    }

    const aliases = DOMAIN_METRIC_ALIASES[domain] || {};
    if (aliases[key] && domainKeys.has(aliases[key])) {
        return aliases[key];
    }

    const normalized = key.toLowerCase().replace(/[\s-]+/g, '_');
    if (domainKeys.has(normalized)) {
        return normalized;
    }

    if (aliases[normalized] && domainKeys.has(aliases[normalized])) {
        return aliases[normalized];
    }

    return null;
}

function getMetricSchema(domain) {
    if (domain) {
        return {
            domain,
            keys: Array.from(DOMAIN_METRIC_KEYS[domain] || []),
            aliases: DOMAIN_METRIC_ALIASES[domain] || {}
        };
    }

    const all = {};
    Object.keys(DOMAIN_METRIC_KEYS).forEach((key) => {
        all[key] = {
            keys: Array.from(DOMAIN_METRIC_KEYS[key]),
            aliases: DOMAIN_METRIC_ALIASES[key] || {}
        };
    });
    return all;
}

module.exports = {
    DOMAIN_METRIC_KEYS,
    DOMAIN_METRIC_ALIASES,
    normalizeMetricKey,
    getMetricSchema
};
