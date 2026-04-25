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
const passport = require('passport');
const session = require('express-session');
const { RedisStore: ConnectRedis } = require('connect-redis');

// Passport Config
require('./config/passport')(passport);

const app = express();

// Trust Proxy for Render/Vercel
app.set('trust proxy', 1);

// Request Tracing
app.use((req, res, next) => {
    req.id = uuidv4();
    res.setHeader('X-Request-ID', req.id);
    next();
});

// Express Session with Redis
app.use(session({
    store: new ConnectRedis({ client: redisClient }),
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    },
    proxy: process.env.NODE_ENV === 'production' // Required for Render/Vercel proxies
}));

// Passport Middleware
app.use(passport.initialize());
app.use(passport.session());

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
// Support multiple origins (comma-separated in CLIENT_URL)
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map(origin => origin.trim().replace(/\/$/, ""));

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.error(`CORS Blocked: ${origin} not in [${allowedOrigins.join(', ')}]`);
            callback(new Error('Not allowed by CORS'));
        }
    },
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
        // Fix: Use spread properly for Redis Cloud compatibility
        sendCommand: async (...args) => {
            const res = await redisClient.call(...args);
            return res;
        },
    }) : undefined
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

// API Status Route
app.get('/', (req, res) => {
    res.json({ 
        success: true, 
        message: 'Ethereal AI API is running',
        environment: process.env.NODE_ENV,
        version: '1.0.0'
    });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    logger.error(`${err.message} - ${req.originalUrl} - ${req.method} - ${req.id}`);
    res.status(500).json({
        success: false,
        error: 'Server Error',
        message: err.message,
        stack: err.stack, // TEMPORARY: Exposing stack for root cause analysis
        requestId: req.id
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
