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