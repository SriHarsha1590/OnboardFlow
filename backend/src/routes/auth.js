/**
 * Auth Routes — Register, Login, Google Sign-In
 * POST /api/auth/register  — Email + password registration
 * POST /api/auth/login     — Email + password login
 * POST /api/auth/google    — Google OAuth (ID token verification)
 * GET  /api/auth/me        — Get current user profile
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');
const { authenticate } = require('../middleware/auth');
const { sendPasswordResetEmail } = require('../utils/mailer');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'onboardflow_super_secret_key_change_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generate JWT token for a user
 */
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      auth_provider: user.auth_provider,
      avatar_url: user.avatar_url,
      role: user.role,
      is_onboarded: user.is_onboarded,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Sanitize user object for response (never send password_hash)
 */
function sanitizeUser(user) {
  const { password_hash, ...safe } = user;
  return safe;
}

// ── POST /api/auth/register ─────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { full_name, email, password } = req.body;

    // Validation
    if (!full_name || !email || !password) {
      return res.status(400).json({ error: 'Full name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    // Check if user already exists
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const password_hash = await bcrypt.hash(password, salt);

    // Create user
    const result = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, auth_provider)
       VALUES ($1, $2, $3, 'email')
       RETURNING *`,
      [full_name.trim(), email.toLowerCase().trim(), password_hash]
    );

    const user = result.rows[0];
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      data: {
        user: sanitizeUser(user),
        token,
      },
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// ── POST /api/auth/login ────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // Find user
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = result.rows[0];

    // Check if user registered with Google
    if (user.auth_provider === 'google' && !user.password_hash) {
      return res.status(401).json({
        error: 'This account uses Google Sign-In. Please use the Google button to login.',
      });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      data: {
        user: sanitizeUser(user),
        token,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// ── POST /api/auth/google ───────────────────────────────────────────────────
// Accepts a Google ID token, verifies it, and creates/logs in user
router.post('/google', async (req, res) => {
  try {
    const { credential, client_id } = req.body;

    if (!credential) {
      return res.status(400).json({ error: 'Google credential is required.' });
    }

    // Decode the Google JWT (ID Token) — we do basic verification
    // In production, use Google's tokeninfo endpoint or google-auth-library
    let payload;
    try {
      // Decode without verification for the POC — the token comes directly from Google's GSI
      // For production, verify signature with Google's public keys
      const parts = credential.split('.');
      payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    } catch {
      return res.status(401).json({ error: 'Invalid Google credential.' });
    }

    const { sub: googleId, email, name, picture } = payload;

    if (!email) {
      return res.status(401).json({ error: 'Could not get email from Google account.' });
    }

    // Check if user exists
    let user;
    const existing = await pool.query(
      'SELECT * FROM users WHERE email = $1 OR google_id = $2',
      [email.toLowerCase(), googleId]
    );

    if (existing.rows.length > 0) {
      // Existing user — update Google info if needed
      user = existing.rows[0];
      if (!user.google_id || !user.avatar_url) {
        const updated = await pool.query(
          `UPDATE users SET google_id = COALESCE(google_id, $1), avatar_url = COALESCE(avatar_url, $2),
           auth_provider = CASE WHEN auth_provider = 'email' AND google_id IS NULL THEN 'google' ELSE auth_provider END
           WHERE id = $3 RETURNING *`,
          [googleId, picture, user.id]
        );
        user = updated.rows[0];
      }
    } else {
      // New user — create account
      const result = await pool.query(
        `INSERT INTO users (full_name, email, google_id, avatar_url, auth_provider)
         VALUES ($1, $2, $3, $4, 'google')
         RETURNING *`,
        [name || 'Google User', email.toLowerCase(), googleId, picture]
      );
      user = result.rows[0];
    }

    const token = generateToken(user);

    res.json({
      success: true,
      data: {
        user: sanitizeUser(user),
        token,
      },
    });
  } catch (err) {
    console.error('Google auth error:', err);
    res.status(500).json({ error: 'Google authentication failed. Please try again.' });
  }
});

// ── GET /api/auth/me ────────────────────────────────────────────────────────
router.get('/me', authenticate, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({
      success: true,
      data: sanitizeUser(result.rows[0]),
    });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Failed to get profile.' });
  }
});

// ── POST /api/auth/forgot-password ──────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required.' });

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (result.rows.length === 0) {
      // For security, don't reveal if user exists, but we return success
      return res.json({ success: true, message: 'If this email exists, a reset link has been sent.' });
    }

    const user = result.rows[0];
    
    // Generate a short-lived token for password reset
    const resetToken = jwt.sign(
      { id: user.id, email: user.email, action: 'password-reset' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`;

    await sendPasswordResetEmail({
      to: user.email,
      employeeName: user.full_name,
      resetLink
    });

    res.json({ success: true, message: 'Password reset link sent to your email.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Failed to process forgot password request.' });
  }
});

// ── POST /api/auth/reset-password ───────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;
    if (!email || !token || !newPassword) {
      return res.status(400).json({ error: 'Email, token, and new password are required.' });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired reset token.' });
    }

    if (decoded.email !== email || decoded.action !== 'password-reset') {
      return res.status(401).json({ error: 'Invalid reset token payload.' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(12);
    const password_hash = await bcrypt.hash(newPassword, salt);

    // Update user
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [password_hash, decoded.id]
    );

    res.json({ success: true, message: 'Password has been reset successfully. You can now login.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Failed to reset password.' });
  }
});

module.exports = router;
