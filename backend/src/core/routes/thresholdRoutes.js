const express = require('express');
const router = express.Router();
const thresholdController = require('../controllers/thresholdController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', thresholdController.getThresholds);
router.put('/:metricId', thresholdController.updateThreshold);

module.exports = router;