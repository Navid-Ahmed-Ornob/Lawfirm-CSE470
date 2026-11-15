// File upload handling (multer). Files are stored under server/uploads/.
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const HttpError = require('../utils/HttpError');

const UPLOAD_ROOT = path.join(__dirname, '..', '..', 'uploads');
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

function safeName(originalName) {
    return originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
}

function extensionFilter(allowed) {
    return (req, file, cb) => {
        const ext = path.extname(file.originalname).slice(1).toLowerCase();
        if (allowed.includes(ext)) return cb(null, true);
        cb(new HttpError(400, `File type not allowed. Allowed: ${allowed.join(', ')}.`));
    };
}

// Lawyer ID / certificate uploaded while registering.
const verificationUpload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            const dir = path.join(UPLOAD_ROOT, 'verification');
            fs.mkdirSync(dir, { recursive: true });
            cb(null, dir);
        },
        filename: (req, file, cb) => {
            const ext = path.extname(file.originalname).toLowerCase();
            cb(null, `doc_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}${ext}`);
        },
    }),
    limits: { fileSize: MAX_SIZE },
    fileFilter: extensionFilter(['pdf', 'jpg', 'jpeg', 'png']),
});

// Case documents. The case id comes from the URL (/api/cases/:caseId/documents).
const caseDocumentUpload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            const dir = path.join(UPLOAD_ROOT, `case_${Number(req.params.caseId)}`);
            fs.mkdirSync(dir, { recursive: true });
            cb(null, dir);
        },
        filename: (req, file, cb) => {
            cb(null, `${Date.now()}_${safeName(file.originalname)}`);
        },
    }),
    limits: { fileSize: MAX_SIZE },
    fileFilter: extensionFilter(['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'txt']),
});

/** Path stored in the database, relative to server/, e.g. "uploads/case_3/171_contract.pdf". */
function storedPath(file) {
    return path.relative(path.join(UPLOAD_ROOT, '..'), file.path).split(path.sep).join('/');
}

/** Absolute path on disk for a path stored in the database. */
function absolutePath(stored) {
    const full = path.resolve(UPLOAD_ROOT, '..', stored);
    // Never serve anything outside the uploads folder.
    if (!full.startsWith(UPLOAD_ROOT + path.sep)) return null;
    return full;
}

module.exports = { verificationUpload, caseDocumentUpload, storedPath, absolutePath, UPLOAD_ROOT };
