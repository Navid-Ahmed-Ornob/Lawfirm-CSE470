// MySQL connection pool shared by every model.
const mysql = require('mysql2/promise');

const timezone = process.env.DB_TIMEZONE || '+06:00';

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'law_firm',
    waitForConnections: true,
    connectionLimit: 10,
    // Return DATE / DATETIME / TIMESTAMP columns as plain strings
    // ("2026-11-14 09:30:00") so no timezone shifting happens in JavaScript.
    dateStrings: true,
    timezone,
});

// Keep MySQL's NOW() in the same timezone as the app (Asia/Dhaka by default).
pool.pool.on('connection', (connection) => {
    connection.query(`SET time_zone = '${timezone}'`);
});

/**
 * Run a query and return the result rows (SELECT) or the result header (INSERT/UPDATE/DELETE).
 * Placeholders (?) are escaped by mysql2, so values are never concatenated into the SQL.
 */
async function query(sql, params = []) {
    const [result] = await pool.query(sql, params);
    return result;
}

/** Run a query and return the first row, or null. */
async function queryOne(sql, params = []) {
    const rows = await query(sql, params);
    return rows[0] || null;
}

/** Run several queries inside one transaction. `work` receives a connection. */
async function transaction(work) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const result = await work(connection);
        await connection.commit();
        return result;
    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
}

module.exports = { pool, query, queryOne, transaction };
