const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Routes
const authRoutes      = require('./routes/auth');
const circlesRoutes   = require('./routes/circles');
const roomsRoutes     = require('./routes/rooms');
const questionsRoutes = require('./routes/questions');
const quizRoutes      = require('./routes/quiz');
const adminRoutes     = require('./routes/admin');

// Socket handlers
const roomSocket = require('./sockets/roomSocket');
const quizSocket = require('./sockets/quizSocket');

dotenv.config();
connectDB();

const app = express();
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

// ── REST Routes ──────────────────────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/circles',   circlesRoutes);
app.use('/api/rooms',     roomsRoutes);
app.use('/api/questions', questionsRoutes);
app.use('/api/quiz',      quizRoutes);
app.use('/api/admin',     adminRoutes);

app.get('/', (req, res) => res.json({ message: '🧠 BrainBattle API is running' }));

// ── Socket.IO ────────────────────────────────────────────────────────────────
roomSocket(io);
quizSocket(io);

// Make io accessible to routes (for broadcast)
app.set('io', io);

// ── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 BrainBattle server running on port ${PORT}`);
});
