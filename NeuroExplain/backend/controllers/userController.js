const bcrypt = require('bcryptjs');
const { pool } = require('../db');
const { generateToken } = require('../middleware/auth');

/**
 * Register a new user
 * POST /api/users/register (or /api/auth/register)
 */
async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    // 1. Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required fields.'
      });
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    // Basic email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    // 2. Check if user already exists
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ? LIMIT 1', [trimmedEmail]);
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists. Please log in.'
      });
    }

    // 3. Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 4. Insert into MySQL
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [trimmedName, trimmedEmail, hashedPassword]
    );

    const newUser = {
      id: result.insertId,
      name: trimmedName,
      email: trimmedEmail
    };

    // 5. Generate token
    const token = generateToken(newUser);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully! Welcome to NeuroExplain.',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email
      }
    });
  } catch (error) {
    console.error('[User Controller] Register error:', error);
    return res.status(500).json({
      success: false,
      message: 'Registration failed due to a server error. Please try again.'
    });
  }
}

/**
 * Log in an existing user
 * POST /api/users/login (or /api/auth/login)
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Find user by email
    const [users] = await pool.query(
      'SELECT id, name, email, password, created_at FROM users WHERE email = ? LIMIT 1',
      [trimmedEmail]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const user = users[0];

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Generate token
    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    console.error('[User Controller] Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Login failed due to an internal server error.'
    });
  }
}

/**
 * Get current authenticated user profile
 * GET /api/users/me (or /api/auth/me)
 */
async function getMe(req, res) {
  try {
    const userId = req.user.id;
    const [rows] = await pool.query(
      'SELECT id, name, email, created_at FROM users WHERE id = ? LIMIT 1',
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.'
      });
    }

    // Count user reports
    const [reportStats] = await pool.query(
      'SELECT COUNT(*) as total_reports FROM reports WHERE user_id = ?',
      [userId]
    );

    return res.status(200).json({
      success: true,
      user: {
        ...rows[0],
        totalReports: reportStats[0]?.total_reports || 0
      }
    });
  } catch (error) {
    console.error('[User Controller] getMe error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve user profile.'
    });
  }
}

/**
 * Update current user profile
 * PUT /api/users/profile
 */
async function updateProfile(req, res) {
  try {
    const userId = req.user.id;
    const { name, currentPassword, newPassword } = req.body;

    if (!name && !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'No profile fields provided to update.'
      });
    }

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is required to set a new password.'
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 6 characters long.'
        });
      }

      const [users] = await pool.query('SELECT password FROM users WHERE id = ?', [userId]);
      const isMatch = await bcrypt.compare(currentPassword, users[0].password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Current password does not match.'
        });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);
    }

    if (name && name.trim().length > 0) {
      await pool.query('UPDATE users SET name = ? WHERE id = ?', [name.trim(), userId]);
    }

    const [updated] = await pool.query('SELECT id, name, email, created_at FROM users WHERE id = ?', [userId]);

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: updated[0]
    });
  } catch (error) {
    console.error('[User Controller] updateProfile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update profile.'
    });
  }
}

module.exports = {
  register,
  login,
  getMe,
  updateProfile
};
