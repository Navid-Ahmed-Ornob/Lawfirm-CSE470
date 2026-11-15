// Model: users table (shared login details for clients, lawyers and admins).
const db = require('../config/db');

const User = {
    findByUsername(username) {
        return db.queryOne(
            'SELECT user_id, full_name, username, password, role FROM users WHERE username = ?',
            [username]
        );
    },

    async usernameOrEmailExists(username, email) {
        const row = await db.queryOne('SELECT user_id FROM users WHERE username = ? OR email = ?', [username, email]);
        return Boolean(row);
    },

    /** Insert a user. Pass a transaction connection as `conn` to run it inside a transaction. */
    async create({ full_name, email, username, passwordHash, role }, conn = null) {
        const sql = 'INSERT INTO users (full_name, email, username, password, role) VALUES (?, ?, ?, ?, ?)';
        const params = [full_name, email, username, passwordHash, role];
        const result = conn ? (await conn.query(sql, params))[0] : await db.query(sql, params);
        return result.insertId;
    },
};

module.exports = User;
