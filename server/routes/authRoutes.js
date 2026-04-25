const express = require('express');
const passport = require('passport');
const { 
    register, 
    login, 
    getMe, 
    updatePassword, 
    updateProfile, 
    deleteAccount, 
    deactivateAccount,
    verifyEmail,
    forgotPassword,
    resetPassword,
    generateToken
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/updatepassword', protect, updatePassword);
router.put('/updateprofile', protect, updateProfile);
router.delete('/delete', protect, deleteAccount);
router.put('/deactivate', protect, deactivateAccount);

// Email Verification & Password Reset
router.get('/verify/:token', verifyEmail);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:token', resetPassword);

// OAuth Routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', 
    passport.authenticate('google', { failureRedirect: '/auth' }),
    (req, res) => {
        const token = generateToken(req.user._id);
        res.redirect(`${process.env.CLIENT_URL}/auth?token=${token}`);
    }
);

module.exports = router;
