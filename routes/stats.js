const express = require('express');
const router = express.Router();
const { connectDB, sql } = require('../config');
const { checkRole } = require('../middleware/auth');
const logger = require('../utils/logger');

// Get statistics data
router.get('/', checkRole(['admin']), async (req, res) => {
    let pool;
    try {
        pool = await connectDB();
        
        // Get data for tickets, companies, and visits
        const [tickets, companies, visits] = await Promise.all([
            pool.request().query('SELECT COUNT(*) as count FROM Tickets'),
            pool.request().query('SELECT COUNT(*) as count FROM Companies'),
            pool.request().query('SELECT COUNT(*) as count FROM Visits')
        ]);
        
        res.json({
            tickets: tickets.recordset || [], 
            companies: companies.recordset || [],
            visits: visits.recordset || []
        });
    } catch (err) {
        logger.error('Error fetching statistics:', err);
        res.status(500).json({ 
            status: 'error',
            message: 'خطأ في تحميل البيانات',
            details: err.message
        });
    }
});

module.exports = router;