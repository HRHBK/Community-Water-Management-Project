const express     = require('express');
const bcrypt      = require('bcryptjs');
const jwt         = require('jsonwebtoken');
const db          = require('../config/db');
const authMiddleware = require('../middleware/auth');
const getClientIp = require('../config/getClientIp');
require('dotenv').config();

const router = express.Router();


// --------------------------------------------------------
// POST /api/auth/login
// Public route — no token required
// --------------------------------------------------------
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // 1. Check required fields
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    // 2. Find the user
    const [users] = await db.query(
      `SELECT id, username, email, password_hash, role, 
              zone_id, member_id, is_active, locked_until,
              failed_login_attempts, must_change_password
       FROM user
       WHERE (username = ? OR email = ?)
         AND deleted_at IS NULL`,
      [username, username]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const user = users[0];

    // 3. Check if account is active
    if (!user.is_active) {
      return res.status(403).json({ error: 'Your account has been deactivated. Contact the administrator.' });
    }

    // 4. Check if account is locked
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      return res.status(403).json({ 
        error: `Account is locked. Try again after ${new Date(user.locked_until).toLocaleTimeString()}.` 
      });
    }

    // 5. Verify password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      // Increment failed attempts
      const newAttempts = user.failed_login_attempts + 1;
      let lockUntil = null;

      // Lock account after 5 failed attempts for 15 minutes
      if (newAttempts >= 5) {
        lockUntil = new Date(Date.now() + 15 * 60 * 1000);
      }

      await db.query(
        `UPDATE user 
         SET failed_login_attempts = ?, locked_until = ?
         WHERE id = ?`,
        [newAttempts, lockUntil, user.id]
      );

      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    // 6. Reset failed attempts on successful login
    await db.query(
      `UPDATE user 
       SET failed_login_attempts = 0, 
           locked_until = NULL,
           last_login_at = NOW()
       WHERE id = ?`,
      [user.id]
    );

    // 7. Generate JWT token
    const token = jwt.sign(
      { id: user.id, role: user.role, zone_id: user.zone_id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // 8. Save session to user_session table
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await db.query(
      `INSERT INTO user_session 
         (user_id, token_hash, ip_address, user_agent, expires_at)
       VALUES (?, ?, ?, ?, ?)`,
      [
        user.id,
        token,
        getClientIp(req),
        req.headers['user-agent'] || null,
        expiresAt
      ]
    );

    // 9. Write to audit_log
    await db.query(
      `INSERT INTO audit_log 
         (user_id, action, table_name, record_id, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        user.id,
        'user.login',
        'user',
        user.id,
        getClientIp(req),
        req.headers['user-agent'] || null
      ]
    );

    // 10. Send response
    res.status(200).json({
      message: 'Login successful.',
      must_change_password: user.must_change_password === 1,
      token,
      user: {
        id:      user.id,
        username:user.username,
        email:   user.email,
        role:    user.role,
        zone_id: user.zone_id
      }
    });

  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});


// --------------------------------------------------------
// POST /api/auth/logout
// Protected route — token required
// --------------------------------------------------------
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    const token = req.headers['authorization'].split(' ')[1];

    // Revoke the session
    await db.query(
      `UPDATE user_session 
       SET revoked_at = NOW() 
       WHERE token_hash = ?`,
      [token]
    );

    // Write to audit_log
    await db.query(
      `INSERT INTO audit_log 
         (user_id, action, table_name, record_id, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        'user.logout',
        'user',
        req.user.id,
        getClientIp(req),
        req.headers['user-agent'] || null
      ]
    );

    res.status(200).json({ message: 'Logged out successfully.' });

  } catch (err) {
    console.error('Logout error:', err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});


// --------------------------------------------------------
// GET /api/auth/me
// Protected route — returns the currently logged in user
// --------------------------------------------------------
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const [users] = await db.query(
      `SELECT u.id, u.username, u.email, u.role,
              u.zone_id, u.member_id, u.must_change_password,
              u.last_login_at, u.created_at,
              z.name AS zone_name,
              cm.first_name, cm.last_name
       FROM user u
       LEFT JOIN water_zone z  ON z.id  = u.zone_id
       LEFT JOIN community_member cm ON cm.id = u.member_id
       WHERE u.id = ?`,
      [req.user.id]
    );

    res.status(200).json({ user: users[0] });

  } catch (err) {
    console.error('Me error:', err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});


module.exports = router;