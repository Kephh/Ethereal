const User = require('../models/User');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

exports.register = async (req, res) => {
    try {
        // Check if database is connected
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({
                success: false,
                message: 'Database not ready. Please ensure MongoDB is running or check your connection string in .env'
            });
        }

        const { username, email, password } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        const user = await User.create({ username, email, password });

        res.status(201).json({
            success: true,
            token: generateToken(user._id),
            user: { id: user._id, username: user.username, email: user.email, role: user.role }
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email }).select('+password');
        if (!user || !(await user.matchPassword(password))) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        if (!user.isActive) {
            return res.status(403).json({ success: false, message: 'Your account is deactivated. Please contact support.' });
        }

        res.status(200).json({
            success: true,
            token: generateToken(user._id),
            user: { id: user._id, username: user.username, email: user.email, role: user.role }
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

exports.getMe = async (req, res) => {
    const user = await User.findById(req.user.id);
    res.status(200).json({ 
        success: true, 
        user: { 
            id: user._id, 
            username: user.username, 
            email: user.email, 
            role: user.role,
            bio: user.bio,
            profilePhoto: user.profilePhoto,
            theme: user.theme,
            createdAt: user.createdAt
        }
    });
};

exports.updateProfile = async (req, res) => {
    try {
        const { username, bio, profilePhoto, theme } = req.body;
        const user = await User.findById(req.user.id);

        if (username) user.username = username;
        if (bio !== undefined) user.bio = bio;
        if (profilePhoto !== undefined) user.profilePhoto = profilePhoto;
        if (theme) user.theme = theme;

        await user.save();

        res.status(200).json({ 
            success: true, 
            user: { 
                id: user._id, 
                username: user.username, 
                email: user.email, 
                role: user.role,
                bio: user.bio,
                profilePhoto: user.profilePhoto,
                theme: user.theme
            } 
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};
exports.updatePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user.id).select('+password');

        if (!(await user.matchPassword(currentPassword))) {
            return res.status(401).json({ success: false, message: 'Current password is incorrect' });
        }

        user.password = newPassword;
        await user.save();

        res.status(200).json({ success: true, message: 'Password updated successfully' });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

exports.deleteAccount = async (req, res) => {
    try {
        const Conversation = require('../models/Conversation');
        await Conversation.deleteMany({ user: req.user.id });
        await User.findByIdAndDelete(req.user.id);
        res.status(200).json({ success: true, message: 'Account deleted successfully' });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

exports.deactivateAccount = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        user.isActive = false;
        await user.save();
        res.status(200).json({ success: true, message: 'Account deactivated' });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};
