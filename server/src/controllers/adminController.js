// Controller: admin actions (lawyer verification).
const Lawyer = require('../models/Lawyer');
const HttpError = require('../utils/HttpError');
const { absolutePath } = require('../middleware/upload');
const { toId } = require('../utils/profiles');

// PATCH /api/admin/lawyers/:lawyerId/verification   body: { action: "approve" | "reject" }
async function setVerification(req, res) {
    const lawyerId = toId(req.params.lawyerId);
    const action = req.body.action;
    if (!lawyerId || !['approve', 'reject'].includes(action)) {
        throw new HttpError(400, 'Invalid request.');
    }

    const approved = action === 'approve';
    const updated = await Lawyer.setVerification(lawyerId, approved, req.session.user.user_id);
    if (!updated) throw new HttpError(404, 'Lawyer not found.');

    res.json({ message: approved ? 'Lawyer verified.' : 'Lawyer rejected.' });
}

// GET /api/admin/lawyers/:lawyerId/document   (the uploaded ID / certificate)
async function verificationDocument(req, res) {
    const stored = await Lawyer.getVerificationDoc(toId(req.params.lawyerId));
    const file = stored && absolutePath(stored);
    if (!file) throw new HttpError(404, 'No document uploaded.');
    res.sendFile(file, (err) => {
        if (err && !res.headersSent) res.status(404).json({ error: 'File not found on the server.' });
    });
}

module.exports = { setVerification, verificationDocument };
