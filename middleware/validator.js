// server/middleware/validator.js
const { validationResult } = require('express-validator');

exports.validate = (validations) => {
    return async (req, res, next) => {
        await Promise.all(validations.map(validation => validation.run(req)));

//         const errors = validationResult(req);
        if (errors.isEmpty()) {
            return next();
        }

        return res.status(400).json({
            status: 'error',
            errors: errors.array()
        });
    };
};