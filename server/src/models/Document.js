// Model: documents table (files uploaded to a case).
const db = require('../config/db');

const Document = {
    findByCase(caseId) {
        return db.query(
            `SELECT d.document_id, d.case_id, d.document_type, d.file_name, d.file_size, d.uploaded_at,
                    d.uploaded_by, u.full_name AS uploader_name
             FROM documents d JOIN users u ON d.uploaded_by = u.user_id
             WHERE d.case_id = ?
             ORDER BY d.uploaded_at DESC, d.document_id DESC`,
            [caseId]
        );
    },

    findById(documentId) {
        return db.queryOne('SELECT * FROM documents WHERE document_id = ?', [documentId]);
    },

    create({ case_id, uploaded_by, document_type, file_name, file_path, file_size }) {
        return db.query(
            `INSERT INTO documents (case_id, uploaded_by, document_type, file_name, file_path, file_size)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [case_id, uploaded_by, document_type, file_name, file_path, file_size]
        );
    },

    remove(documentId) {
        return db.query('DELETE FROM documents WHERE document_id = ?', [documentId]);
    },
};

module.exports = Document;
