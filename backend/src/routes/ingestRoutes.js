const express = require('express');
const router = express.Router();
const ingestController = require('../controllers/ingestController');

router.post('/', ingestController.ingestData);

module.exports = router;
