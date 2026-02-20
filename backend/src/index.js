const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');

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

app.use('/api/ingest', ingestRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/config', configRoutes);
app.use('/api/logs', logRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Socket Connection
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join_variant', (variant) => {
    socket.join(variant);
    console.log(`Client ${socket.id} joined variant: ${variant}`);
  });

  socket.on('leave_variant', (variant) => {
    socket.leave(variant);
    console.log(`Client ${socket.id} left variant: ${variant}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Smart Monitoring Platform running on port ${PORT}`);
  console.log(`   API: http://localhost:${PORT}/api`);
  console.log(`   WebSocket: ws://localhost:${PORT}`);
});
