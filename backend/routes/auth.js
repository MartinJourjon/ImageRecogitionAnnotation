const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { generateToken, verifyToken } = require('../middleware/auth');

// Sign up
router.post('/signup',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('nickname').optional().trim()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, nickname } = req.body;

    try {
      // Check if user already exists
      const userCheck = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (userCheck.rows.length > 0) {
        return res.status(400).json({ error: 'User already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const userResult = await pool.query(
        'INSERT INTO users (email, password_hash, created_at) VALUES ($1, $2, NOW()) RETURNING id, email, created_at',
        [email, hashedPassword]
      );

      const user = userResult.rows[0];

      // Create annotator profile
      const displayNickname = nickname || email.split('@')[0];
      await pool.query(
        `INSERT INTO annotators (user_id, nickname, role, xp, total_points, total_annotations, created_at)
         VALUES ($1, $2, 'annotator', 0, 0, 0, NOW())`,
        [user.id, displayNickname]
      );

      // Generate token
      const token = generateToken(user.id);

      res.status(201).json({
        user: {
          id: user.id,
          email: user.email
        },
        token
      });
    } catch (error) {
      console.error('Signup error:', error);
      res.status(500).json({ error: 'Server error during signup' });
    }
  }
);

// Sign in
router.post('/signin',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      // Find user
      const userResult = await pool.query(
        'SELECT id, email, password_hash FROM users WHERE email = $1',
        [email]
      );

      if (userResult.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const user = userResult.rows[0];

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate token
      const token = generateToken(user.id);

      res.json({
        user: {
          id: user.id,
          email: user.email
        },
        token
      });
    } catch (error) {
      console.error('Signin error:', error);
      res.status(500).json({ error: 'Server error during signin' });
    }
  }
);

// Get current user (protected route)
router.get('/me', verifyToken, async (req, res) => {
  try {
    const userResult = await pool.query(
      'SELECT id, email, created_at FROM users WHERE id = $1',
      [req.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const annotatorResult = await pool.query(
      'SELECT nickname, role, xp, total_points, total_annotations FROM annotators WHERE user_id = $1',
      [req.userId]
    );

    const user = userResult.rows[0];
    const annotator = annotatorResult.rows[0] || {};

    res.json({
      user: {
        id: user.id,
        email: user.email,
        ...annotator
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
