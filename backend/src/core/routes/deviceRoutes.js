const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/deviceController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

router.use(authMiddleware, adminMiddleware);

// Create device
router.post('/', deviceController.createDevice);

// Get all devices
router.get('/', deviceController.getAllDevices);

// Get device by ID
router.get('/:id', deviceController.getDeviceById);

// Update device
router.put('/:id', deviceController.updateDevice);

// Delete device
router.delete('/:id', deviceController.deleteDevice);

module.exports = router;