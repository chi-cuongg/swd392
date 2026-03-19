const express = require('express');
const router = express.Router();
const configController = require('../controllers/configController');

router.get('/metric-schema', configController.getMetricSchema);
router.get('/organizations', configController.getOrganizations);
router.get('/my-org', configController.getMyOrganization);
router.get('/variants', configController.getVariants);
router.get('/variants/:id', configController.getVariantById);

module.exports = router;