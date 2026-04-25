const express = require('express');
const { sendMessage, getConversations, getConversationById, deleteConversation } = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect); // All chat routes protected

router.post('/send', sendMessage);
router.get('/history', getConversations);
router.get('/history/:id', getConversationById);
router.delete('/history/:id', deleteConversation);

module.exports = router;
