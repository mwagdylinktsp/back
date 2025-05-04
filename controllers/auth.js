// controllers/auth.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { connectDB, sql } = require('../config');
const logger = require('../utils/logger');

exports.register = async (req, res) => {
    let pool;
    try {
        const { username, password, role = 'user', company_id } = req.body;
        
        // Check if user already exists
        pool = await connectDB();
        const userExists = await pool.request()
            .input('username', sql.NVarChar, username)
            .query('SELECT * FROM Users WHERE username = @username');
            
        if (userExists.recordset.length > 0) {
            return res.status(400).json({ message: 'اسم المستخدم موجود بالفعل' });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create user
        const result = await pool.request()
            .input('username', sql.NVarChar, username)
            .input('password', sql.NVarChar, hashedPassword)
            .input('role', sql.NVarChar, role)
            .input('company_id', sql.Int, company_id || null)
            .query(`
                INSERT INTO Users (username, password, role, company_id)
                VALUES (@username, @password, @role, @company_id);
                SELECT SCOPE_IDENTITY() AS id;
            `);
            
        res.status(201).json({ 
            id: result.recordset[0].id,
            username,
            message: 'تم إنشاء المستخدم بنجاح' 
        });
    } catch (err) {
        logger.error('Error registering user:', err);
        res.status(500).json({ message: 'خطأ في الخادم' });
    }
};

exports.login = async (req, res) => {
    let pool;
    try {
        const { username, password } = req.body;
        
        pool = await connectDB();
        const result = await pool.request()
            .input('username', sql.NVarChar, username)
            .query('SELECT * FROM Users WHERE username = @username');
            
        if (result.recordset.length === 0) {
            return res.status(401).json({ message: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
        }
        
        const user = result.recordset[0];
        const isPasswordValid = await bcrypt.compare(password, user.password);
        
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
        }
        
        // Create token
        const token = jwt.sign(
            { 
                id: user.id, 
                username: user.username, 
                role: user.role,
                company_id: user.company_id 
            }, 
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role
            }
        });
    } catch (err) {
        logger.error('Error during login:', err);
        res.status(500).json({ message: 'خطأ في الخادم' });
    }
};

exports.updateSettings = async (req, res) => {
    let pool;
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;
        
        pool = await connectDB();
        const result = await pool.request()
            .input('id', sql.Int, userId)
            .query('SELECT * FROM Users WHERE id = @id');
            
        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'المستخدم غير موجود' });
        }
        
        const user = result.recordset[0];
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'كلمة المرور الحالية غير صحيحة' });
        }
        
        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        // Update password
        await pool.request()
            .input('id', sql.Int, userId)
            .input('password', sql.NVarChar, hashedPassword)
            .query('UPDATE Users SET password = @password WHERE id = @id');
            
        res.json({ message: 'تم تحديث كلمة المرور بنجاح' });
    } catch (err) {
        logger.error('Error updating settings:', err);
        res.status(500).json({ message: 'خطأ في الخادم' });
    }
};