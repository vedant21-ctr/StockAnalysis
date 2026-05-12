const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const connectDB = require('./src/config/db');

// Route files
const authRoutes = require('./src/routes/authRoutes');
const inventoryRoutes = require('./src/routes/inventoryRoutes');
const salesRoutes = require('./src/routes/salesRoutes');
const analyticsRoutes = require('./src/routes/analyticsRoutes');

// Connect to Database
connectDB();

const app = express();
const server = http.createServer(app);

// Socket.IO setup with CORS
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// Make io accessible to routes/controllers
app.set('io', io);

// Security Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
}));

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200 // Increased for realtime-heavy app
});
app.use('/api/', limiter);

// Standard Middleware
app.use(express.json());
app.use(morgan('dev'));

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date(),
        uptime: process.uptime(),
        connections: io.engine.clientsCount
    });
});

// ─── Socket.IO Realtime Engine ────────────────────────────────────────────────
io.on('connection', (socket) => {
    console.log(`⚡ Client connected: ${socket.id}`);

    // Join dashboard room for live updates
    socket.on('join:dashboard', () => {
        socket.join('dashboard');
        socket.emit('connected', { message: 'Joined live dashboard feed' });
    });

    // Join inventory room
    socket.on('join:inventory', () => {
        socket.join('inventory');
    });

    socket.on('disconnect', () => {
        console.log(`🔌 Client disconnected: ${socket.id}`);
    });
});

// Simulate live activity feed every 8 seconds (demo mode)
const activityTypes = [
    { type: 'sale', messages: ['New sale recorded', 'Order processed', 'Transaction complete'] },
    { type: 'stock', messages: ['Stock updated', 'Inventory adjusted', 'Reorder triggered'] },
    { type: 'alert', messages: ['Low stock alert', 'Reorder threshold reached'] },
    { type: 'user', messages: ['User logged in', 'Report generated', 'Export completed'] }
];

setInterval(() => {
    const category = activityTypes[Math.floor(Math.random() * activityTypes.length)];
    const message = category.messages[Math.floor(Math.random() * category.messages.length)];
    const amount = category.type === 'sale' ? Math.floor(Math.random() * 2000) + 100 : null;

    io.to('dashboard').emit('activity:new', {
        id: Date.now(),
        type: category.type,
        message,
        amount,
        timestamp: new Date().toISOString()
    });
}, 8000);

// Centralized Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || 'Internal Server Error',
        stack: process.env.NODE_ENV === 'development' ? err.stack : null
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    console.log(`⚡ Socket.IO realtime engine active`);
});

module.exports = { io };
