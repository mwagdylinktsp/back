const express = require('express');
const router = express.Router();
const { connectDB, sql } = require('../config');
const { checkRole } = require('../middleware/auth');
const logger = require('../utils/logger');

// الحصول على جميع التذاكر
router.get('/', checkRole(['admin', 'company_admin', 'user']), async (req, res) => {
    let pool;
    try {
        pool = await connectDB();
        let query = `
            SELECT t.*, c.name as company_name, u.username as created_by
            FROM Tickets t
            JOIN Companies c ON t.company_id = c.id
            JOIN Users u ON t.user_id = u.id
        `;

        if (req.user.role !== 'admin') {
            query += ` WHERE t.company_id = @company_id`;
        }

        query += ` ORDER BY t.created_at DESC`;

        const request = pool.request();
        if (req.user.role !== 'admin') {
            request.input('company_id', sql.Int, req.user.company_id);
        }

        const result = await request.query(query);
        res.json(result.recordset);
    } catch (err) {
        logger.error('Error fetching tickets:', err);
        res.status(500).json({ message: 'خطأ في الخادم' });
    }
});

// إضافة تذكرة جديدة
router.post('/', checkRole(['admin', 'company_admin', 'user']), async (req, res) => {
    let pool;
    try {
        const { title, description, priority, company_id } = req.body;

        if (!title || !description || !priority) {
            return res.status(400).json({ message: 'جميع الحقول مطلوبة' });
        }

        const ticketCompanyId = req.user.role === 'admin' ? company_id : req.user.company_id;

        if (!ticketCompanyId) {
            return res.status(400).json({ message: 'معرف الشركة مطلوب' });
        }

        pool = await connectDB();
        const result = await pool.request()
            .input('company_id', sql.Int, ticketCompanyId)
            .input('user_id', sql.Int, req.user.id)
            .input('title', sql.NVarChar, title)
            .input('description', sql.NText, description)
            .input('priority', sql.NVarChar, priority)
            .input('status', sql.NVarChar, 'open')
            .query(`
                INSERT INTO Tickets (company_id, user_id, title, description, priority, status)
                VALUES (@company_id, @user_id, @title, @description, @priority, @status);
                SELECT SCOPE_IDENTITY() AS id;
            `);
        
        res.json({ id: result.recordset[0].id, message: 'تم إنشاء التذكرة بنجاح' });
    } catch (err) {
        logger.error('Error creating ticket:', err);
        res.status(500).json({ message: 'خطأ في الخادم' });
    }
});

module.exports = router;
