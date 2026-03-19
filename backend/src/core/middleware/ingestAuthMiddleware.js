const authMiddleware = require('./authMiddleware');
const { SYSTEM_ADMIN } = require('../utils/roleUtils');

const INGEST_API_KEY = process.env.INGEST_API_KEY || '';
const ALLOW_INGEST_NO_AUTH = process.env.ALLOW_INGEST_NO_AUTH === 'true';

module.exports = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authMiddleware(req, res, next);
    }

    const requestApiKey = req.headers['x-ingest-key'];
    if (INGEST_API_KEY && requestApiKey === INGEST_API_KEY) {
        const bodyOrgId = req.body && req.body.organizationId;
        if (!bodyOrgId) {
            return res.status(400).json({ error: 'organizationId is required for ingest API key mode' });
        }

        req.userId = 'ingest-service';
        req.userRole = SYSTEM_ADMIN;
        req.organizationId = bodyOrgId;
        return next();
    }

    if (ALLOW_INGEST_NO_AUTH) {
        const bodyOrgId = req.body && req.body.organizationId;
        if (!bodyOrgId) {
            return res.status(400).json({ error: 'organizationId is required when ALLOW_INGEST_NO_AUTH is enabled' });
        }

        req.userId = 'ingest-anonymous';
        req.userRole = SYSTEM_ADMIN;
        req.organizationId = bodyOrgId;
        return next();
    }

    return res.status(401).json({ error: 'Unauthorized ingest request' });
};
