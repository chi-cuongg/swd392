const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../utils/prisma');
const { normalizeRole } = require('../utils/roleUtils');
const emailUtil = require('../../utils/email');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

class AuthService {
    async getPublicOrganizations() {
        return prisma.organization.findMany({
            select: { id: true, slug: true, name: true },
            orderBy: { name: 'asc' }
        });
    }

    /**
     * Register a new user in an organization
     */
    async register(organizationId, organizationSlug, email, password, name) {
        const normalizedOrganizationSlug = String(organizationSlug || '').trim();
        const normalizedEmail = String(email || '').trim().toLowerCase();

        // Validate inputs
        if ((!organizationId && !normalizedOrganizationSlug) || !normalizedEmail || !password) {
            throw {
                status: 400,
                message: 'Organization ID or slug, email and password are required'
            };
        }

        // Find organization
        const organization = organizationId
            ? await prisma.organization.findUnique({ where: { id: organizationId } })
            : await prisma.organization.findUnique({ where: { slug: normalizedOrganizationSlug } });

        if (!organization) {
            throw {
                status: 404,
                message: 'Organization not found'
            };
        }

        // Check if user already exists
        const existing = await prisma.user.findFirst({
            where: { organizationId: organization.id, email: normalizedEmail }
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
                email: normalizedEmail,
                password: hashed,
                name: name || normalizedEmail.split('@')[0]
            }
        });

        // Generate JWT token
        const normalizedRole = normalizeRole(user.role);
        const token = jwt.sign(
            { userId: user.id, role: normalizedRole, organizationId: organization.id },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        return {
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: normalizedRole,
                organizationId: organization.id
            }
        };
    }

    /**
     * Login user
     */
    async login(organizationId, organizationSlug, email, password) {
        const normalizedOrganizationSlug = String(organizationSlug || '').trim();
        const normalizedEmail = String(email || '').trim().toLowerCase();

        // Validate inputs
        if ((!organizationId && !normalizedOrganizationSlug) || !normalizedEmail || !password) {
            throw {
                status: 400,
                message: 'Organization ID or slug, email and password are required'
            };
        }

        // Find organization
        const organization = organizationId
            ? await prisma.organization.findUnique({ where: { id: organizationId } })
            : await prisma.organization.findUnique({ where: { slug: normalizedOrganizationSlug } });

        if (!organization) {
            throw {
                status: 404,
                message: 'Organization not found'
            };
        }

        // Find user
        const user = await prisma.user.findFirst({
            where: { organizationId: organization.id, email: normalizedEmail }
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
        const normalizedRole = normalizeRole(user.role);
        const token = jwt.sign(
            { userId: user.id, role: normalizedRole, organizationId: organization.id },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        return {
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: normalizedRole,
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

        return {
            ...user,
            role: normalizeRole(user.role)
        };
    }

    /**
     * Reset current user's password
     */
    async resetPassword(userId, currentPassword, newPassword) {
        if (!currentPassword || !newPassword) {
            throw {
                status: 400,
                message: 'currentPassword and newPassword are required'
            };
        }

        if (String(newPassword).length < 6) {
            throw {
                status: 400,
                message: 'newPassword must be at least 6 characters'
            };
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw {
                status: 404,
                message: 'User not found'
            };
        }

        const valid = await bcrypt.compare(currentPassword, user.password);
        if (!valid) {
            throw {
                status: 401,
                message: 'Current password is incorrect'
            };
        }

        const hashed = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: userId },
            data: { password: hashed }
        });

        return { success: true };
    }

    /**
     * Reset password for target user (system admin flow)
     */
    async adminResetPassword(targetUserId, newPassword) {
        if (!newPassword) {
            throw {
                status: 400,
                message: 'newPassword is required'
            };
        }

        if (String(newPassword).length < 6) {
            throw {
                status: 400,
                message: 'newPassword must be at least 6 characters'
            };
        }

        const user = await prisma.user.findUnique({ where: { id: targetUserId } });
        if (!user) {
            throw {
                status: 404,
                message: 'User not found'
            };
        }

        const hashed = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: targetUserId },
            data: { password: hashed }
        });

        return { success: true, id: targetUserId };
    }

    /**
     * Request a password reset email
     */
    async requestPasswordReset(email) {
        if (!email) throw { status: 400, message: 'Email is required' };
        
        const normalizedEmail = String(email).trim().toLowerCase();
        const user = await prisma.user.findFirst({ where: { email: normalizedEmail } });
        
        // Always return success even if user not found to prevent email enumeration
        if (!user) return { success: true, message: 'If email exists, a reset link was sent.' };

        // Generate token and expiry (1 hour)
        const resetToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
        const expires = new Date(Date.now() + 60 * 60 * 1000);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken: tokenHash,
                resetTokenExpires: expires
            }
        });

        // Send email (passing raw token)
        await emailUtil.sendResetEmail(user.email, resetToken);
        
        return { success: true, message: 'If email exists, a reset link was sent.' };
    }

    /**
     * Reset password using token
     */
    async resetPasswordWithToken(token, newPassword) {
        if (!token || !newPassword) {
            throw { status: 400, message: 'Token and newPassword are required' };
        }
        if (String(newPassword).length < 6) {
            throw { status: 400, message: 'newPassword must be at least 6 characters' };
        }

        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        
        const user = await prisma.user.findFirst({
            where: {
                resetToken: tokenHash,
                resetTokenExpires: { gt: new Date() }
            }
        });

        if (!user) {
            throw { status: 400, message: 'Token is invalid or has expired' };
        }

        const hashed = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashed,
                resetToken: null,
                resetTokenExpires: null
            }
        });

        return { success: true, message: 'Password has been reset' };
    }
}

module.exports = new AuthService();
