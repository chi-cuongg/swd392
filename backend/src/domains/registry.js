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

module.exports = {
    DOMAINS,
    getAllDomains,
    getDomain
};
