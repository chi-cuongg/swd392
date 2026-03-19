const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/deviceController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

router.use(authMiddleware, adminMiddleware);

// Get all devices
router.get('/', deviceController.getAllDevices);

// Get device by ID
router.get('/:id', deviceController.getDeviceById);

// Update device
router.put('/:id', deviceController.updateDevice);

module.exports = router;