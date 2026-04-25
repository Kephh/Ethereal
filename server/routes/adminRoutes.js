const express = require('express');
const { getStats, getAllUsers } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.use(authorize('admin')); // Only admins can access these routes

router.get('/stats', getStats);
router.get('/users', getAllUsers);

module.exports = router;
