const { isSystemAdmin } = require('../utils/roleUtils');

module.exports = (req, res, next) => {
    if (!isSystemAdmin(req.userRole)) {
        return res.status(403).json({ error: 'SYSTEM_ADMIN role required' });
    }
    next();
};
