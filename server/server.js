require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const helmet = require('helmet');
const logger = require('./config/logger');
const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const redisClient = require('./config/redis');
const hpp = require('hpp');

const app = express();

// Request Tracing
app.use((req, res, next) => {
    req.id = uuidv4();
    res.setHeader('X-Request-ID', req.id);
    next();
});

// Middleware
app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "blob:"],
            connectSrc: ["'self'", process.env.CLIENT_URL || 'http://localhost:5173', "https://api.groq.com"]
        }
    } : false,
}));
// Clean CLIENT_URL to remove trailing slash (prevents common CORS issues)
const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, "");

app.use(cors({
    origin: clientUrl,
    credentials: true
}));
app.use(express.json({ limit: '10mb' })); // Limit body size for large profile photos

// Safe NoSQL Sanitize Middleware (Express 5 Compatible)
const sanitize = (obj) => {
    if (obj instanceof Object) {
        for (const key in obj) {
            if (key.startsWith('$') || key.includes('.')) {
                delete obj[key];
            } else if (obj[key] instanceof Object) {
                sanitize(obj[key]);
            }
        }
    }
    return obj;
};

app.use((req, res, next) => {
    sanitize(req.body);
    sanitize(req.params);
    next();
});

app.use(hpp()); // Prevent HTTP Parameter Pollution

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500,
    message: 'Too many requests from this IP, please try again after 15 minutes',
    store: redisClient ? new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
    }) : undefined // Fallback to memory if Redis is not configured
});
app.use('/api/', limiter);

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => logger.info('MongoDB Connected successfully to Atlas'))
    .catch(err => logger.error('MongoDB Connection Error:', err));

const path = require('path');

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Serve Frontend in Production
if (process.env.NODE_ENV === 'production') {
    const clientPath = path.join(__dirname, '../client/dist');
    app.use(express.static(clientPath));

    app.get('/*splat', (req, res) => {
        // Only serve index.html if not an API route
        if (!req.path.startsWith('/api/')) {
            res.sendFile(path.resolve(clientPath, 'index.html'));
        }
    });
} else {
    app.get('/', (req, res) => {
        res.json({ message: 'Ethereal AI API is running' });
    });
}

// Error Handling Middleware
app.use((err, req, res, next) => {
    logger.error(`${err.name}: ${err.message}`, { 
        id: req.id, 
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined 
    });

    res.status(500).json({
        success: false,
        error: 'Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'An internal error occurred. Request ID: ' + req.id
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
