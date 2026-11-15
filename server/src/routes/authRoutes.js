const express = require('express');
const auth = require('../controllers/authController');
const { verificationUpload } = require('../middleware/upload');

const router = express.Router();

router.post('/login', auth.login);
router.post('/register', verificationUpload.single('verification_doc'), auth.register);
router.post('/logout', auth.logout);
router.get('/me', auth.me);

module.exports = router;
