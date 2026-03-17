const prisma = require('../utils/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

exports.register = async(req, res) => {
    try {
        const { organizationId, organizationSlug, email, password, name } = req.body;
        if ((!organizationId && !organizationSlug) || !email || !password) {
            return res.status(400).json({ error: 'Organization, email and password are required' });
        }

        const organization = organizationId ?
            await prisma.organization.findUnique({ where: { id: organizationId } }) :
            await prisma.organization.findUnique({ where: { slug: organizationSlug } });

        if (!organization) {
            return res.status(404).json({ error: 'Organization not found' });
        }

        const existing = await prisma.user.findFirst({
            where: { organizationId: organization.id, email }
        });
        if (existing) {
            return res.status(409).json({ error: 'Email already registered in this organization' });
        }

        const hashed = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                organizationId: organization.id,
                email,
                password: hashed,
                name: name || email.split('@')[0]
            }
        });

        const token = jwt.sign({ userId: user.id, role: user.role, organizationId: organization.id }, JWT_SECRET, { expiresIn: '24h' });
        res.status(201).json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                organizationId: organization.id
            }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
};

exports.login = async(req, res) => {
    try {
        const { organizationId, organizationSlug, email, password } = req.body;
        if ((!organizationId && !organizationSlug) || !email || !password) {
            return res.status(400).json({ error: 'Organization, email and password are required' });
        }

        const organization = organizationId ?
            await prisma.organization.findUnique({ where: { id: organizationId } }) :
            await prisma.organization.findUnique({ where: { slug: organizationSlug } });

        if (!organization) {
            return res.status(404).json({ error: 'Organization not found' });
        }

        const user = await prisma.user.findFirst({ where: { organizationId: organization.id, email } });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user.id, role: user.role, organizationId: organization.id }, JWT_SECRET, { expiresIn: '24h' });
        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                organizationId: organization.id
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
};

exports.me = async(req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.userId },
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
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get user info' });
    }
};