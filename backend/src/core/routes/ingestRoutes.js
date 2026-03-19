const express = require('express');
const router = express.Router();
const ingestController = require('../controllers/ingestController');
const ingestAuthMiddleware = require('../middleware/ingestAuthMiddleware');

router.post('/', ingestAuthMiddleware, ingestController.ingestData);

module.exports = router;
