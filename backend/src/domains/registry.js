/**
 * Domain Registry
 * Loads all domain configurations
 */

const homeConfig = require('./home/config/config');
const hospitalConfig = require('./hospital/config/config');
const factoryConfig = require('./factory/config/config');
const farmConfig = require('./farm/config/config');
const trafficConfig = require('./traffic/config/config');

const DOMAINS = {
    home: homeConfig,
    hospital: hospitalConfig,
    factory: factoryConfig,
    farm: farmConfig,
    traffic: trafficConfig
};

/**
 * Get all domain configurations
 */
function getAllDomains() {
    return DOMAINS;
}

/**
 * Get specific domain configuration
 */
function getDomain(domainId) {
    return DOMAINS[domainId] || null;
}

/**
 * Get metric aliases for a domain
 */
function getMetricAliases(domainId) {
    const domain = getDomain(domainId);
    return domain ? domain.metricAliases : {};
}

/**
 * Get metric keys for a domain
 */
function getMetricKeys(domainId) {
    const domain = getDomain(domainId);
    if (!domain || !domain.widgets) return [];
    
    const keys = new Set();
    domain.widgets.forEach(widget => {
        if (widget && widget.key) {
            keys.add(widget.key);
        }
    });
    return Array.from(keys);
}

/**
 * Build metric keys for all domains
 */
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

/**
 * Build metric aliases for all domains
 */
const DOMAIN_METRIC_ALIASES = Object.fromEntries(
    Object.entries(getAllDomains()).map(([domain, config]) => {
        return [domain, config.metricAliases || {}];
    })
);

/**
 * Normalize metric key to canonical form for a domain
 */
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

/**
 * Get metric schema for a domain or all domains
 */
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
    DOMAINS,
    getAllDomains,
    getDomain,
    getMetricAliases,
    getMetricKeys,
    DOMAIN_METRIC_KEYS,
    DOMAIN_METRIC_ALIASES,
    normalizeMetricKey,
    getMetricSchema
};
