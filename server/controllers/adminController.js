const User = require('../models/User');
const Conversation = require('../models/Conversation');

exports.getStats = async (req, res) => {
    try {
        const userCount = await User.countDocuments();
        const conversationCount = await Conversation.countDocuments();

        // Mock token usage (in a real app, you'd track this in the DB)
        const totalTokens = conversationCount * 450;

        res.status(200).json({
            success: true,
            stats: {
                users: userCount,
                conversations: conversationCount,
                tokenUsage: totalTokens,
                status: 'Healthy'
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getAllUsers = async (req, res) => {
    const users = await User.find().select('-password');
    res.status(200).json({ success: true, users });
};
