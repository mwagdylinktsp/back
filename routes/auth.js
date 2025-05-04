// Example of how to implement validation in routes/auth.js

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validator');
const { checkRole } = require('../middleware/auth');

// Validation rules for the login endpoint
const loginValidation = [
  body('username')
    .notEmpty().withMessage('اسم المستخدم مطلوب')
    .isString().withMessage('اسم المستخدم يجب أن يكون نصًا'),
  body('password')
    .notEmpty().withMessage('كلمة المرور مطلوبة')
    .isLength({ min: 6 }).withMessage('كلمة المرور يجب أن تحتوي على 6 أحرف على الأقل')
];

// Validation rules for the register endpoint
const registerValidation = [
  body('username')
    .notEmpty().withMessage('اسم المستخدم مطلوب')
    .isString().withMessage('اسم المستخدم يجب أن يكون نصًا')
    .isLength({ min: 3, max: 50 }).withMessage('اسم المستخدم يجب أن يكون بين 3 و 50 حرفًا'),
  body('password')
    .notEmpty().withMessage('كلمة المرور مطلوبة')
    .isLength({ min: 6 }).withMessage('كلمة المرور يجب أن تحتوي على 6 أحرف على الأقل')
];

// Validation rules for updating settings
const updateSettingsValidation = [
  body('currentPassword')
    .notEmpty().withMessage('كلمة المرور الحالية مطلوبة'),
  body('newPassword')
    .notEmpty().withMessage('كلمة المرور الجديدة مطلوبة')
    .isLength({ min: 6 }).withMessage('كلمة المرور الجديدة يجب أن تحتوي على 6 أحرف على الأقل')
];

// Register route with validation
router.post('/register', validate(registerValidation), authController.register);

// Login route with validation
router.post('/login', validate(loginValidation), authController.login);

// Update settings route with validation and authentication
router.put('/settings', checkRole(['user', 'admin']), validate(updateSettingsValidation), authController.updateSettings);

module.exports = router;