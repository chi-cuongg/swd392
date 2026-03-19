const express = require('express');
const router = express.Router();
const logController = require('../controllers/logController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

// GET /api/logs?deviceId=xxx&limit=50
router.get('/', logController.getLogs);

// GET /api/logs/stats — aggregated stats
router.get('/stats', logController.getStats);

module.exports = router;