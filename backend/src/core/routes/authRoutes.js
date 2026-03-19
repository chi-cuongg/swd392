const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/organizations', authController.getOrganizations);
router.post('/forgot-password', authController.requestPasswordReset);
router.post('/reset-password-with-token', authController.resetPasswordWithToken);

router.get('/me', authMiddleware, authController.me);
router.post('/reset-password', authMiddleware, authController.resetPassword);
router.post('/users/:id/reset-password', authMiddleware, adminMiddleware, authController.adminResetPassword);

module.exports = router;
