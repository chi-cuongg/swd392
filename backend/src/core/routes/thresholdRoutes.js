const express = require('express');
const router = express.Router();
const thresholdController = require('../controllers/thresholdController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

router.use(authMiddleware, adminMiddleware);

router.get('/', thresholdController.getThresholds);
router.put('/:metricId', thresholdController.updateThreshold);

module.exports = router;