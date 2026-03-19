const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

class AuthService {
    /**
     * Register a new user in an organization
     */
    async register(organizationId, organizationSlug, email, password, name) {
        // Validate inputs
        if ((!organizationId && !organizationSlug) || !email || !password) {
            throw {
                status: 400,
                message: 'Organization ID or slug, email and password are required'
            };
        }

        // Find organization
        const organization = organizationId
            ? await prisma.organization.findUnique({ where: { id: organizationId } })
            : await prisma.organization.findUnique({ where: { slug: organizationSlug } });

        if (!organization) {
            throw {
                status: 404,
                message: 'Organization not found'
            };
        }

        // Check if user already exists
        const existing = await prisma.user.findFirst({
            where: { organizationId: organization.id, email }
        });

        if (existing) {
            throw {
                status: 409,
                message: 'Email already registered in this organization'
            };
        }

        // Hash password
        const hashed = await bcrypt.hash(password, 10);

        // Create user
        const user = await prisma.user.create({
            data: {
                organizationId: organization.id,
                email,
                password: hashed,
                name: name || email.split('@')[0]
            }
        });

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, role: user.role, organizationId: organization.id },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        return {
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                organizationId: organization.id
            }
        };
    }

    /**
     * Login user
     */
    async login(organizationId, organizationSlug, email, password) {
        // Validate inputs
        if ((!organizationId && !organizationSlug) || !email || !password) {
            throw {
                status: 400,
                message: 'Organization ID or slug, email and password are required'
            };
        }

        // Find organization
        const organization = organizationId
            ? await prisma.organization.findUnique({ where: { id: organizationId } })
            : await prisma.organization.findUnique({ where: { slug: organizationSlug } });

        if (!organization) {
            throw {
                status: 404,
                message: 'Organization not found'
            };
        }

        // Find user
        const user = await prisma.user.findFirst({
            where: { organizationId: organization.id, email }
        });

        if (!user) {
            throw {
                status: 401,
                message: 'Invalid credentials'
            };
        }

        // Verify password
        const valid = await bcrypt.compare(password, user.password);

        if (!valid) {
            throw {
                status: 401,
                message: 'Invalid credentials'
            };
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, role: user.role, organizationId: organization.id },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        return {
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                organizationId: organization.id
            }
        };
    }

    /**
     * Get current user info
     */
    async getCurrentUser(userId) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                organization: {
                    select: { id: true, slug: true, name: true }
                }
            }
        });

        if (!user) {
            throw {
                status: 404,
                message: 'User not found'
            };
        }

        return user;
    }
}

module.exports = new AuthService();
