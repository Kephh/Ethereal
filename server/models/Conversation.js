const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    role: {
        type: String,
        enum: ['user', 'assistant', 'system'],
        required: true
    },
    content: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const conversationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        default: 'New Conversation'
    },
    messages: [messageSchema],
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });
// Indexes for high-performance scaling
conversationSchema.index({ user: 1, lastUpdated: -1 });
conversationSchema.index({ user: 1, createdAt: -1 });
conversationSchema.index({ title: 'text' }); // Allow search functionality in future

module.exports = mongoose.model('Conversation', conversationSchema);
