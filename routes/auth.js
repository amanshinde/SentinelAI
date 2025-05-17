const express = require('express');
const { createUser, getUsers, deleteUser, login, getMe } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/login', login);

// Protected routes
router.get('/me', protect, getMe);

// Admin only routes
router.route('/users')
    .get(protect, authorize('admin'), getUsers)
    .post(protect, authorize('admin'), createUser);

router.route('/users/:id')
    .delete(protect, authorize('admin'), deleteUser);

module.exports = router;
