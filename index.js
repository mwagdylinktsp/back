const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { connectDB } = require('./config');
const logger = require('./utils/logger');
const { initializeDatabase } = require('./utils/initDb');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const companyRoutes = require('./routes/companies');
const visitRoutes = require('./routes/visits');
const ticketRoutes = require('./routes/tickets');
const dashboardRoutes = require('./routes/dashboard');
const docsRoutes = require('./routes/docs'); // Make sure to create this file or import properly

const app = express();

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3015',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Cache-Control']
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "blob:"],
            connectSrc: ["'self'", process.env.FRONTEND_URL, `http://localhost:${process.env.PORT}`]
        }
    }
}));

const limiter = rateLimit({
    max: 100,
    windowMs: 15 * 60 * 1000
});
app.use(limiter);

app.use(compression());

app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url}`);
    next();
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/visits', visitRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/docs', docsRoutes);

// Basic route for testing
app.get('/', (req, res) => {
    res.json({ message: 'Norween API Server is running' });
});

// 404 handler
app.use((req, res) => {
    logger.warn(`Route not found: ${req.method} ${req.url}`);
    res.status(404).json({
        status: 'error',
        message: 'الصفحة غير موجودة'
    });
});

// Error handler
app.use((err, req, res, next) => {
    logger.error('Error:', err);
    logger.error('Stack:', err.stack);

    const statusCode = err.statusCode || 500;
    const message = err.message || 'حدث خطأ في الخادم';

    const response = {
        status: 'error',
        statusCode,
        message,
        ...(process.env.NODE_ENV === 'development' && {
            stack: err.stack,
            details: err
        })
    };

    res.status(statusCode).json(response);
});

const startServer = async () => {
    try {
        await initializeDatabase();
        logger.info('Database initialization completed');

        await connectDB();
        logger.info('Database connected successfully');

        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => {
            logger.info(`Server is running on port ${PORT}`);
        });
    } catch (err) {
        logger.error('Server startup error:', err);
        process.exit(1);
    }
};

process.on('unhandledRejection', (err) => {
    logger.error('Unhandled Promise Rejection:', err);
    if (process.env.NODE_ENV === 'development') {
        process.exit(1);
    }
});

startServer();