const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');

// Rate limiter for authentication attempts (protect against brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login or registration attempts. Please try again after 15 minutes.'
  }
});

// Authentication endpoints
router.post('/register', authLimiter, userController.register);
router.post('/login', authLimiter, userController.login);
router.post('/logout', (req, res) => {
  // Stateless JWT logout - frontend clears token
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully.'
  });
});

// Protected profile endpoints
router.get('/me', authenticateToken, userController.getMe);
router.put('/profile', authenticateToken, userController.updateProfile);

module.exports = router;
