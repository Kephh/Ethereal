const Groq = require('groq-sdk');
const Conversation = require('../models/Conversation');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

exports.sendMessage = async (req, res) => {
    try {
        const { message, conversationId } = req.body;
        let conversation;

        if (conversationId) {
            conversation = await Conversation.findOne({ _id: conversationId, user: req.user.id });
            if (!conversation) {
                return res.status(404).json({ success: false, message: 'Conversation not found or access denied' });
            }
        } else {
            conversation = await Conversation.create({ user: req.user.id, messages: [] });
        }

        // Generate title for new conversation based on first query
        if (conversation.messages.length === 0) {
            try {
                const titleGen = await groq.chat.completions.create({
                    messages: [
                        { role: 'system', content: 'Summarize the user query into a 2-3 word title. Return only the title text.' },
                        { role: 'user', content: message }
                    ],
                    model: 'llama-3.3-70b-versatile',
                });
                conversation.title = titleGen.choices[0].message.content.replace(/["']/g, '').trim();
            } catch (titleErr) {
                // Fallback to truncated message if title generation fails
                conversation.title = message.substring(0, 30) + (message.length > 30 ? '...' : '');
            }
        }

        // Add user message to history
        conversation.messages.push({ role: 'user', content: message });

        // Prepare messages for Groq
        const chatMessages = conversation.messages.map(m => ({
            role: m.role,
            content: m.content
        }));

        // Stream from Groq
        const stream = await groq.chat.completions.create({
            messages: chatMessages,
            model: 'llama-3.3-70b-versatile',
            stream: true,
        });

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // Send conversationId first so client can track it
        res.write(`data: ${JSON.stringify({ conversationId: conversation._id })}\n\n`);

        let fullResponse = '';
        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            fullResponse += content;
            res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }

        // Save assistant message and update conversation
        conversation.messages.push({ role: 'assistant', content: fullResponse });
        conversation.lastUpdated = Date.now();
        await conversation.save();
        
        // Invalidate cache
        if (redisClient) {
            await redisClient.del(`history:${req.user.id}`);
        }

        res.write('data: [DONE]\n\n');
        res.end();

    } catch (err) {
        res.status(500).json({ success: false, error: 'AI Error', message: err.message });
    }
};

const redisClient = require('../config/redis');

exports.getConversations = async (req, res) => {
    try {
        const cacheKey = `history:${req.user.id}`;
        
        // Try to get from cache
        if (redisClient) {
            const cachedHistory = await redisClient.get(cacheKey);
            if (cachedHistory) {
                return res.status(200).json({ success: true, conversations: JSON.parse(cachedHistory), source: 'cache' });
            }
        }

        const conversations = await Conversation.find({ user: req.user.id }).sort({ lastUpdated: -1 });

        // Save to cache for 5 minutes
        if (redisClient) {
            await redisClient.setex(cacheKey, 300, JSON.stringify(conversations));
        }

        res.status(200).json({ success: true, conversations, source: 'db' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getConversationById = async (req, res) => {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation || conversation.user.toString() !== req.user.id) {
        return res.status(404).json({ success: false, message: 'Conversation not found' });
    }
    res.status(200).json({ success: true, conversation });
};
exports.deleteConversation = async (req, res) => {
    try {
        const conversation = await Conversation.findOne({ _id: req.params.id, user: req.user.id });
        if (!conversation) {
            return res.status(404).json({ success: false, message: 'Conversation not found' });
        }
        await Conversation.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: 'Conversation deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
