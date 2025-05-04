const sql = require('mssql');
const logger = require('./utils/logger');
require('dotenv').config();

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    options: {
        encrypt: true,
        trustServerCertificate: true,
        enableArithAbort: true
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

let pool = null;

async function connectDB() {
    try {
        if (!pool) {
            pool = await new sql.ConnectionPool(config).connect();
            logger.info('New database connection established');
        }
        return pool;
    } catch (err) {
        logger.error('Database connection error:', err);
        throw err;
    }
}

// Graceful shutdown
process.on('SIGINT', async () => {
    try {
        if (pool) {
            await pool.close();
            logger.info('Database connection closed.');
        }
        process.exit(0);
    } catch (err) {
        logger.error('Error during shutdown:', err);
        process.exit(1);
    }
});

module.exports = {
    connectDB,
    sql
};
