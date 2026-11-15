const express = require('express');
const admin = require('../controllers/adminController');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireRole('admin'));
router.patch('/lawyers/:lawyerId/verification', admin.setVerification);
router.get('/lawyers/:lawyerId/document', admin.verificationDocument);

module.exports = router;
