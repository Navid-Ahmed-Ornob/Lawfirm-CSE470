// Model: clients table (client profile linked to a user).
const db = require('../config/db');

const Client = {
    findByUserId(userId) {
        return db.queryOne('SELECT client_id, user_id, phone, address FROM clients WHERE user_id = ?', [userId]);
    },

    async create({ user_id, phone, address }, conn = null) {
        const sql = 'INSERT INTO clients (user_id, phone, address) VALUES (?, ?, ?)';
        const params = [user_id, phone, address];
        const result = conn ? (await conn.query(sql, params))[0] : await db.query(sql, params);
        return result.insertId;
    },
};

module.exports = Client;
