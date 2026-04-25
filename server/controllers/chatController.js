const Groq = require('groq-sdk');
const Conversation = require('../models/Conversation');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

exports.sendMessage = async (req, res) => {
    try {
        const { message, conversationId } = req.body;

        // --- STAGE 1: MEDICAL TRIAGE & GRADING ---
        const triageGen = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: `You are a medical triage system. Grade the user's prompt for medical, health, or lifestyle relevancy on a scale of 0-10. 
                    - 10: Specific medical condition/symptom.
                    - 7-9: General health or lifestyle question.
                    - 4-6: Vaguely related to health.
                    - 3: General queries, no coding/technical questions.   
                    - 0-2: Totally unrelated specialist questions (engineering, etc.).
                    Also detect if this is an emergency. 
                    Respond ONLY in JSON: {"score": number, "is_emergency": boolean, "reason": string}`
                },
                { role: 'user', content: message }
            ],
            model: 'llama-3.3-70b-versatile',
            response_format: { type: "json_object" }
        });

        const triage = JSON.parse(triageGen.choices[0].message.content);

        // Relevancy Threshold (Score < 3 = Reject)
        if (triage.score < 3) {
            return res.status(200).json({
                success: true,
                message: "This question isn't relevant to medical or health context. I am specialized in medical and lifestyle assistance.",
                isFiltered: true
            });
        }

        // --- STAGE 2: STRUCTURED MEDICAL RESPONSE ---
        let conversation;
        if (conversationId) {
            conversation = await Conversation.findOne({ _id: conversationId, user: req.user.id });
        } else {
            conversation = await Conversation.create({ user: req.user.id, messages: [] });
            // Generate title
            conversation.title = message.substring(0, 30) + (message.length > 30 ? '...' : '');
        }

        const medicalSystemPrompt = `You are an Ethereal Medical AI (Educational Assistant).
        IMPORTANT: You are NOT a Registered Medical Practitioner (RMP) in India. This conversation does not constitute a doctor-patient relationship.

        RULES (Indian Ethical Compliance):
        1. Answer medical, health, or lifestyle questions for educational purposes only.
        2. EMERGENCIES: If an emergency is detected, START the response with: "### 🚨 POTENTIAL EMERGENCY\n**Please immediately dial 102 (Ambulance) or 108 (Emergency) and proceed to the nearest hospital.**\n\n---"
        3. DOSAGE: NEVER provide dosages for prescription (Schedule H/H1) drugs. For OTC or supplements, provide ONLY general ranges and emphasize: "Consult a pharmacist or doctor for exact dosage."
        4. DATA PRIVACY: Remind users to keep their health data private as per the DPDP Act 2023.
        5. STRUCTURE (Use Markdown):
           ### 🩺 Medical Analysis
           - **Triage Score**: ${triage.score}/10
           - **Status**: ${triage.is_emergency ? "EMERGENCY" : "Routine Inquiry"}
           - **Context**: (Brief summary)

           ---

           ### 💡 Educational Advice
           (Provide health/lifestyle information using bullet points where possible)

           ---

           ### ⚖️ Legal & Safety Note
           - Not a substitute for a professional diagnosis.
           - This tool is for informational purposes under Indian Digital Health guidelines.
           - **Disclaimer**: Please consult a Registered Medical Practitioner (RMP) for professional diagnosis.`;

        const chatMessages = [
            { role: 'system', content: medicalSystemPrompt },
            ...conversation.messages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: message }
        ];

        const stream = await groq.chat.completions.create({
            messages: chatMessages,
            model: 'llama-3.3-70b-versatile',
            stream: true,
        });

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        res.write(`data: ${JSON.stringify({ conversationId: conversation._id, triage })}\n\n`);

        let fullResponse = '';
        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            fullResponse += content;
            res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }

        conversation.messages.push({ role: 'user', content: message });
        conversation.messages.push({ role: 'assistant', content: fullResponse });
        conversation.lastUpdated = Date.now();
        await conversation.save();

        if (redisClient) {
            await redisClient.del(`history:${req.user.id}`);
        }

        res.write('data: [DONE]\n\n');
        res.end();

    } catch (err) {
        console.error('Medical API Error:', err);
        res.status(500).json({ success: false, error: 'Medical AI Error', message: err.message });
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
