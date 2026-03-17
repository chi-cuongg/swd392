const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const prisma = require('./utils/prisma');
const { ensureDefaultData } = require('./utils/bootstrap');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Attach io to request for use in controllers
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Routes
const ingestRoutes = require('./routes/ingestRoutes');
const deviceRoutes = require('./routes/deviceRoutes');
const authRoutes = require('./routes/authRoutes');
const configRoutes = require('./routes/configRoutes');
const logRoutes = require('./routes/logRoutes');
const thresholdRoutes = require('./routes/thresholdRoutes');
const alertRoutes = require('./routes/alertRoutes');

app.use('/api/ingest', ingestRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/config', configRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/thresholds', thresholdRoutes);
app.use('/api/alerts', alertRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Socket Connection
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('join_scope', ({ organizationId, domain }) => {
        if (!organizationId) return;
        const orgRoom = `org:${organizationId}`;
        socket.join(orgRoom);
        if (domain) {
            const domainRoom = `org:${organizationId}:domain:${domain}`;
            socket.join(domainRoom);
            console.log(`Client ${socket.id} joined scope: ${domainRoom}`);
            return;
        }
        console.log(`Client ${socket.id} joined scope: ${orgRoom}`);
    });

    socket.on('leave_scope', ({ organizationId, domain }) => {
        if (!organizationId) return;
        if (domain) {
            const domainRoom = `org:${organizationId}:domain:${domain}`;
            socket.leave(domainRoom);
            console.log(`Client ${socket.id} left scope: ${domainRoom}`);
            return;
        }
        const orgRoom = `org:${organizationId}`;
        socket.leave(orgRoom);
        console.log(`Client ${socket.id} left scope: ${orgRoom}`);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
async function start() {
    try {
        await ensureDefaultData(prisma);
        server.listen(PORT, () => {
            console.log(`Smart Monitoring Platform running on port ${PORT}`);
            console.log(`API: http://localhost:${PORT}/api`);
            console.log(`WebSocket: ws://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

start();