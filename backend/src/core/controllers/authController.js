const authService = require('../services/authService');

/**
 * Controller layer - handles HTTP request/response
 * Business logic is delegated to authService
 */

exports.register = async(req, res) => {
    try {
        const { organizationId, organizationSlug, email, password, name } = req.body;
        const result = await authService.register(organizationId, organizationSlug, email, password, name);
        res.status(201).json(result);
    } catch (error) {
        console.error('Register error:', error);
        const status = error.status || 500;
        const message = error.message || 'Registration failed';
        res.status(status).json({ error: message });
    }
};

exports.login = async(req, res) => {
    try {
        const { organizationId, organizationSlug, email, password } = req.body;
        const result = await authService.login(organizationId, organizationSlug, email, password);
        res.json(result);
    } catch (error) {
        console.error('Login error:', error);
        const status = error.status || 500;
        const message = error.message || 'Login failed';
        res.status(status).json({ error: message });
    }
};

exports.getOrganizations = async(req, res) => {
    try {
        const organizations = await authService.getPublicOrganizations();
        res.json(organizations);
    } catch (error) {
        console.error('Get public organizations error:', error);
        const status = error.status || 500;
        const message = error.message || 'Failed to fetch organizations';
        res.status(status).json({ error: message });
    }
};

exports.me = async(req, res) => {
    try {
        const user = await authService.getCurrentUser(req.userId);
        res.json(user);
    } catch (error) {
        console.error('Get user error:', error);
        const status = error.status || 500;
        const message = error.message || 'Failed to get user info';
        res.status(status).json({ error: message });
    }
};

exports.resetPassword = async(req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const result = await authService.resetPassword(req.userId, currentPassword, newPassword);
        res.json(result);
    } catch (error) {
        console.error('Reset password error:', error);
        const status = error.status || 500;
        const message = error.message || 'Failed to reset password';
        res.status(status).json({ error: message });
    }
};

exports.adminResetPassword = async(req, res) => {
    try {
        const { newPassword } = req.body;
        const result = await authService.adminResetPassword(req.params.id, newPassword);
        res.json(result);
    } catch (error) {
        console.error('Admin reset password error:', error);
        const status = error.status || 500;
        const message = error.message || 'Failed to reset password';
        res.status(status).json({ error: message });
    }
};

exports.requestPasswordReset = async (req, res) => {
    try {
        const { email, organizationSlug } = req.body;
        const result = await authService.requestPasswordReset(email, organizationSlug);
        res.json(result);
    } catch (error) {
        console.error('Request password reset error:', error);
        const status = error.status || 500;
        const message = error.message || 'Failed to request password reset';
        res.status(status).json({ error: message });
    }
};

exports.resetPasswordWithToken = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        const result = await authService.resetPasswordWithToken(token, newPassword);
        res.json(result);
    } catch (error) {
        console.error('Reset password with token error:', error);
        const status = error.status || 500;
        const message = error.message || 'Failed to reset password';
        res.status(status).json({ error: message });
    }
};