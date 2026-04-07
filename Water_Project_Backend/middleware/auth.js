const jwt     = require('jsonwebtoken');
const db      = require('../config/db');
require('dotenv').config();

module.exports = async (req, res, next) => {
  try {
    // 1. Get token from the Authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];

    // 2. Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Check if the session exists and has not been revoked
    const [sessions] = await db.query(
      `SELECT id FROM user_session
       WHERE token_hash = ? 
         AND revoked_at IS NULL 
         AND expires_at > NOW()`,
      [token]
    );

    if (sessions.length === 0) {
      return res.status(401).json({ error: 'Session expired or revoked. Please log in again.' });
    }

    // 4. Check the user is still active
    const [users] = await db.query(
      `SELECT id, role, zone_id, member_id 
       FROM user 
       WHERE id = ? 
         AND is_active = 1 
         AND deleted_at IS NULL`,
      [decoded.id]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'User account not found or deactivated.' });
    }

    // 5. Attach user info to the request for use in routes
    req.user = users[0];

    next();

  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token has expired. Please log in again.' });
    }
    return res.status(401).json({ error: 'Invalid token.' });
  }
};