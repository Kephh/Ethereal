const express = require('express');
const { register, login, getMe, updatePassword, updateProfile, deleteAccount, deactivateAccount } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/updatepassword', protect, updatePassword);
router.put('/updateprofile', protect, updateProfile);
router.delete('/delete', protect, deleteAccount);
router.put('/deactivate', protect, deactivateAccount);

module.exports = router;
