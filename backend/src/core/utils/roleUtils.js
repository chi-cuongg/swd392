const SYSTEM_ADMIN = 'SYSTEM_ADMIN';
const ORG_USER = 'ORG_USER';

function normalizeRole(role) {
    const value = String(role || '').toUpperCase();
    if (value === 'ADMIN' || value === SYSTEM_ADMIN) return SYSTEM_ADMIN;
    return ORG_USER;
}

function isSystemAdmin(role) {
    return normalizeRole(role) === SYSTEM_ADMIN;
}

module.exports = {
    SYSTEM_ADMIN,
    ORG_USER,
    normalizeRole,
    isSystemAdmin
};
