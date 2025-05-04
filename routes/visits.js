const express = require('express');
const router = express.Router();
const { connectDB, sql } = require('../config');
const { checkRole } = require('../middleware/auth');
const logger = require('../utils/logger');

// الحصول على جميع الزيارات
router.get('/', checkRole(['admin', 'company_admin']), async (req, res) => {
    let pool;
    try {
        pool = await connectDB();
        let query = `
            SELECT v.*, c.name as company_name 
            FROM Visits v
            JOIN Companies c ON v.company_id = c.id
        `;

        if (req.user.role !== 'admin') {
            query += ` WHERE v.company_id = @company_id`;
        }

        query += ` ORDER BY v.visit_date DESC`;

        const request = pool.request();
        if (req.user.role !== 'admin') {
            request.input('company_id', sql.Int, req.user.company_id);
        }

        const result = await request.query(query);
        res.json(result.recordset);
    } catch (err) {
        logger.error('Error fetching visits:', err);
        res.status(500).json({ message: 'خطأ في الخادم' });
    }
});

// إضافة زيارة جديدة
router.post('/', checkRole(['admin', 'company_admin']), async (req, res) => {
    let pool;
    try {
        const { company_id, visit_date, notes } = req.body;

        if (!company_id || !visit_date) {
            return res.status(400).json({ message: 'الشركة وتاريخ الزيارة مطلوبان' });
        }

        if (req.user.role !== 'admin' && company_id !== req.user.company_id) {
            return res.status(403).json({ message: 'ليس لديك صلاحية لإضافة زيارات لشركات أخرى' });
        }

        pool = await connectDB();
        const result = await pool.request()
            .input('company_id', sql.Int, company_id)
            .input('visit_date', sql.Date, new Date(visit_date))
            .input('notes', sql.NText, notes || null)
            .input('status', sql.NVarChar, 'scheduled')
            .query(`
                INSERT INTO Visits (company_id, visit_date, notes, status)
                VALUES (@company_id, @visit_date, @notes, @status);
                SELECT SCOPE_IDENTITY() AS id;
            `);
        
        res.json({ id: result.recordset[0].id, message: 'تم إضافة الزيارة بنجاح' });
    } catch (err) {
        logger.error('Error creating visit:', err);
        res.status(500).json({ message: 'خطأ في الخادم' });
    }
});

module.exports = router;
