const express = require('express');
const router = express.Router();
const configController = require('../controllers/configController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

router.use(authMiddleware);

router.get('/metric-schema', configController.getMetricSchema);
router.get('/organizations', configController.getOrganizations);
router.get('/variants', configController.getVariants);
router.get('/variants/:id', configController.getVariantById);

router.post('/organizations', adminMiddleware, configController.createOrganization);
router.put('/organizations/:organizationId', adminMiddleware, configController.updateOrganization);
router.delete('/organizations/:organizationId', adminMiddleware, configController.deleteOrganization);
router.get('/organizations/:organizationId/users', adminMiddleware, configController.getOrganizationUsers);
router.post('/organizations/:organizationId/users', adminMiddleware, configController.addUserToOrganization);
router.delete('/organizations/:organizationId/users/:userId', adminMiddleware, configController.removeUserFromOrganization);

module.exports = router;