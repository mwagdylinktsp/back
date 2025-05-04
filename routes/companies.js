const express = require('express');
const router = express.Router();
const { connectDB, sql } = require('../config');
const { checkRole } = require('../middleware/auth');
const logger = require('../utils/logger');

// الحصول على جميع الشركات
router.get('/', checkRole(['admin', 'company_admin']), async (req, res) => {
    let pool;
    try {
        pool = await connectDB();
        const result = await pool.request()
            .query('SELECT * FROM Companies ORDER BY created_at DESC');
        res.json(result.recordset);
    } catch (err) {
        logger.error('Error fetching companies:', err);
        res.status(500).json({ message: 'خطأ في الخادم' });
    }
});

// إضافة شركة جديدة
router.post('/', checkRole(['admin']), async (req, res) => {
    let pool;
    try {
        const { name, contract_type, contract_start, contract_end, amount } = req.body;
        
        // Input validation
        if (!name) {
            return res.status(400).json({ message: 'اسم الشركة مطلوب' });
        }

        pool = await connectDB();
        const result = await pool.request()
            .input('name', sql.NVarChar, name)
            .input('contract_type', sql.NVarChar, contract_type || null)
            .input('contract_start', sql.Date, contract_start || null)
            .input('contract_end', sql.Date, contract_end || null)
            .input('amount', sql.Decimal(10,2), amount || 0)
            .input('status', sql.NVarChar, 'active')
            .query(`
                INSERT INTO Companies (name, contract_type, contract_start, contract_end, amount, status)
                VALUES (@name, @contract_type, @contract_start, @contract_end, @amount, @status);
                SELECT SCOPE_IDENTITY() AS id;
            `);
        
        res.json({ id: result.recordset[0].id, message: 'تم إضافة الشركة بنجاح' });
    } catch (err) {
        logger.error('Error creating company:', err);
        res.status(500).json({ message: 'خطأ في الخادم' });
    }
});

module.exports = router;
