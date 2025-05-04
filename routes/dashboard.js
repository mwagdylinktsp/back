const express = require('express');
const router = express.Router();
const { connectDB, sql } = require('../config');
const { auth, checkRole } = require('../middleware/auth');
const logger = require('../utils/logger');

router.get('/', auth, checkRole(['admin', 'company_admin', 'user']), async (req, res) => {
    let pool;
    try {
        pool = await connectDB();
        const dashboardData = {};

        switch (req.user.role) {
            case 'admin': {
                const [companies, tickets, visits, users] = await Promise.all([
                    pool.request().query('SELECT * FROM Companies ORDER BY name'),
                    pool.request().query(`
                        SELECT t.id, t.title, t.status, t.priority, t.created_at,
                               c.name as company_name, u.username as created_by 
                        FROM Tickets t 
                        JOIN Companies c ON t.company_id = c.id 
                        JOIN Users u ON t.user_id = u.id 
                        ORDER BY t.created_at DESC
                    `),
                    pool.request().query(`
                        SELECT v.id, v.visit_date, v.status, v.notes,
                               c.name as company_name
                        FROM Visits v 
                        JOIN Companies c ON v.company_id = c.id 
                        ORDER BY v.visit_date DESC
                    `),
                    pool.request().query('SELECT id, username, role FROM Users ORDER BY username')
                ]);

                dashboardData.companies = companies.recordset;
                dashboardData.tickets = tickets.recordset;
                dashboardData.visits = visits.recordset;
                dashboardData.users = users.recordset;
                break;
            }

            case 'company_admin': {
                const [adminTickets, adminVisits, adminUsers] = await Promise.all([
                    pool.request()
                        .input('company_id', sql.Int, req.user.company_id)
                        .query(`
                            SELECT t.id, t.title, t.status, t.priority, t.created_at,
                                   c.name as company_name, u.username as created_by 
                            FROM Tickets t 
                            JOIN Companies c ON t.company_id = c.id 
                            JOIN Users u ON t.user_id = u.id 
                            WHERE t.company_id = @company_id
                            ORDER BY t.created_at DESC
                        `),
                    pool.request()
                        .input('company_id', sql.Int, req.user.company_id)
                        .query(`
                            SELECT v.id, v.visit_date, v.status, v.notes,
                                   c.name as company_name
                            FROM Visits v 
                            JOIN Companies c ON v.company_id = c.id 
                            WHERE v.company_id = @company_id
                            ORDER BY v.visit_date DESC
                        `),
                    pool.request()
                        .input('company_id', sql.Int, req.user.company_id)
                        .query('SELECT id, username, role FROM Users WHERE company_id = @company_id ORDER BY username')
                ]);

                dashboardData.tickets = adminTickets.recordset;
                dashboardData.visits = adminVisits.recordset;
                dashboardData.users = adminUsers.recordset;
                break;
            }

            case 'user': {
                const [userTickets, userVisits] = await Promise.all([
                    pool.request()
                        .input('user_id', sql.Int, req.user.id)
                        .input('company_id', sql.Int, req.user.company_id)
                        .query(`
                            SELECT t.id, t.title, t.status, t.priority, t.created_at,
                                   c.name as company_name, u.username as created_by
                            FROM Tickets t
                            JOIN Companies c ON t.company_id = c.id
                            JOIN Users u ON t.user_id = u.id
                            WHERE (t.user_id = @user_id OR t.status = 'open') AND t.company_id = @company_id
                            ORDER BY t.created_at DESC
                        `),
                    pool.request()
                        .input('company_id', sql.Int, req.user.company_id)
                        .query(`
                            SELECT v.id, v.visit_date, v.status, v.notes,
                                   c.name as company_name
                            FROM Visits v 
                            JOIN Companies c ON v.company_id = c.id 
                            WHERE v.company_id = @company_id
                            ORDER BY v.visit_date DESC
                        `)
                ]);

                dashboardData.tickets = userTickets.recordset;
                dashboardData.visits = userVisits.recordset;
                break;
            }
        }

        res.json({
            status: 'success',
            data: dashboardData
        });
    } catch (err) {
        logger.error('Error fetching dashboard data:', err);
        res.status(500).json({
            status: 'error',
            message: 'خطأ في تحميل البيانات',
            details: err.message
        });
    }
});

module.exports = router;