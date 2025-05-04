const express = require('express');
const router = express.Router();
const { sql, connectDB } = require('../config');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const { checkRole } = require('../middleware/auth.js');

// Register route
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password || password.length < 6) {
      return res.status(400).json({ message: 'اسم المستخدم وكلمة المرور (6 أحرف على الأقل) مطلوبين' });
    }

    const pool = await connectDB();

    const userExists = await pool.request()
      .input('username', sql.NVarChar, username)
      .query('SELECT username FROM Users WHERE username = @username');

    if (userExists.recordset.length > 0) {
      return res.status(400).json({ message: 'اسم المستخدم موجود بالفعل' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const result = await pool.request()
      .input('username', sql.NVarChar, username)
      .input('password', sql.NVarChar, hashedPassword)
      .input('role', sql.NVarChar, 'user')
      .query(`
        INSERT INTO Users (username, password, role)
        VALUES (@username, @password, @role);
        SELECT SCOPE_IDENTITY() as id;
      `);

    res.json({ 
      id: result.recordset[0].id, 
      username, 
      message: 'تم إنشاء المستخدم بنجاح' 
    });
  } catch (err) {
    logger.error('Register error:', err);
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    logger.info(`Login attempt for username: ${username}`);
    
    const pool = await connectDB();
    const result = await pool.request()
      .input('username', sql.NVarChar, username)
      .query('SELECT * FROM Users WHERE username = @username');

    const user = result.recordset[0];
    
    if (!user) {
      logger.info(`Login failed: User ${username} not found`);
      return res.status(400).json({ message: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      logger.info(`Login failed: Invalid password for user ${username}`);
      return res.status(400).json({ message: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
    }

    const token = jwt.sign(
      { 
        id: user.id, 
        role: user.role, 
        username: user.username,
        permissions: user.permissions || [] 
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    logger.info(`Login successful for user ${username}`);
    
    res.json({ 
      token: token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        permissions: user.permissions || []
      }
    });
  } catch (err) {
    logger.error('Login error:', err);
    res.status(500).json({ message: 'حدث خطأ في الخادم، يرجى المحاولة مرة أخرى' });
  }
});

// Update user settings route
router.put('/settings', checkRole(['user', 'admin']), async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'يجب إدخال كلمة المرور الحالية والجديدة (6 أحرف على الأقل)' });
    }

    const pool = await connectDB();

    const userResult = await pool.request()
      .input('id', sql.Int, req.user.id)
      .query('SELECT password FROM Users WHERE id = @id');

    const user = userResult.recordset[0];
    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ message: 'كلمة المرور الحالية غير صحيحة' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.request()
      .input('id', sql.Int, req.user.id)
      .input('password', sql.NVarChar, hashedPassword)
      .query('UPDATE Users SET password = @password WHERE id = @id');

    res.json({ message: 'تم تحديث كلمة المرور بنجاح' });
  } catch (err) {
    logger.error('Settings update error:', err);
    res.status(500).json({ message: 'حدث خطأ في تحديث البيانات' });
  }
});

module.exports = router;
