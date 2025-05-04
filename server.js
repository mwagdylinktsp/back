const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3015',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Cache-Control']
}));

app.use(bodyParser.json());
app.use(express.json());

// Import routes
const authRoutes = require('./routes/auth');
const companyRoutes = require('./routes/companies');
const ticketRoutes = require('./routes/tickets');
const visitRoutes = require('./routes/visits');
const dashboardRoutes = require('./routes/dashboard');
const docsRoutes = require('./routes/docs');
const statsRoutes = require('./routes/stats');
const invoicesRoutes = require('./routes/invoices');

// Use routes with proper path patterns
app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/visits', visitRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/docs', docsRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/invoices', invoicesRoutes);

// Basic route for testing
app.get('/', (req, res) => {
    res.json({ message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;