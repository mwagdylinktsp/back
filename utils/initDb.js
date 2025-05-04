const sql = require('mssql');
const fs = require('fs').promises;
const path = require('path');
const logger = require('./logger');
const bcrypt = require('bcryptjs');

async function createAdminUser(pool) {
    try {
        const hashedPassword = bcrypt.hashSync('admin123', 10);
        await pool.request()
            .input('username', sql.NVarChar, 'admin')
            .input('password', sql.NVarChar, hashedPassword)
            .input('role', sql.NVarChar, 'admin')
            .query(`
                IF NOT EXISTS (SELECT * FROM Users WHERE username = @username)
                BEGIN
                    INSERT INTO Users (username, password, role)
                    VALUES (@username, @password, @role)
                END
            `);
        logger.info('Admin user check completed');
    } catch (error) {
        logger.error('Error creating admin user:', error);
        throw error;
    }
}

async function initializeDatabase() {
    try {
        const config = {
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            server: process.env.DB_SERVER,
            options: {
                encrypt: true,
                trustServerCertificate: true,
                enableArithAbort: true
            }
        };

        let pool = await new sql.ConnectionPool(config).connect();

        const dbName = process.env.DB_DATABASE;
        const result = await pool.request()
            .input('database_name', sql.VarChar, dbName)
            .query(`
                SELECT database_id FROM sys.databases WHERE Name = @database_name
            `);

        if (result.recordset.length === 0) {
            logger.info(`Database ${dbName} does not exist. Creating...`);

            await pool.request()
                .input('database_name', sql.VarChar, dbName)
                .query(`CREATE DATABASE [${dbName}]`);

            logger.info(`Database ${dbName} created successfully`);

            await pool.close();

            const dbConfig = {
                ...config,
                database: dbName
            };

            pool = await new sql.ConnectionPool(dbConfig).connect();

            const schemaPath = path.join(__dirname, '..', 'database.sql');
            const schema = await fs.readFile(schemaPath, 'utf8');
            const commands = schema.split(';').filter(cmd => cmd.trim());

            for (const command of commands) {
                if (command.trim()) {
                    await pool.request().query(command);
                }
            }

            logger.info('Database schema created successfully');
        } else {
            logger.info(`Database ${dbName} already exists`);
            await pool.close();

            const dbConfig = {
                ...config,
                database: dbName
            };

            pool = await new sql.ConnectionPool(dbConfig).connect();
        }

        await createAdminUser(pool);

        await pool.close();
        return true;
    } catch (error) {
        logger.error('Database initialization error:', error);
        throw error;
    }
}

module.exports = { initializeDatabase };
