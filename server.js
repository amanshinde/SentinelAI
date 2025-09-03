require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const path = require('path');
const morgan = require('morgan');
const http = require('http');
const socketIo = require('socket.io');
const connectDB = require('./config/db');

// Import routes
const authRoutes = require('./routes/auth');
const faceRoutes = require('./routes/faces');
const cameraRoutes = require('./routes/cameras');
const detectionRoutes = require('./routes/detections');
const settingsRoutes = require('./routes/settings');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload({
    createParentPath: true,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max file size
    abortOnLimit: true
}));
app.use(morgan('dev'));

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, 'frontend')));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/faces', faceRoutes);
app.use('/api/cameras', cameraRoutes);
app.use('/api/detections', detectionRoutes);
app.use('/api/settings', settingsRoutes);

// Serve frontend for any other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Make io available to routes
app.set('io', io);

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Connect to MongoDB and start server
connectDB().then(() => {
    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}).catch(err => {
    console.error('Server failed to start:', err);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Promise Rejection:', err);
});
