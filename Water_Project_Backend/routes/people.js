const express        = require('express');
const bcrypt         = require('bcryptjs');
const db             = require('../config/db');
const authMiddleware = require('../middleware/auth');
const getClientIp    = require('../config/getClientIp');

const router = express.Router();

router.use(authMiddleware);


// ============================================================
// HOUSEHOLD
// ============================================================

// GET /api/people/households — get all households
router.get('/households', async (req, res) => {
  if (req.user.role === 'representative') {
    return res.status(403).json({ error: 'Access denied.' });
  }
  try {
    const [households] = await db.query(
      `SELECT h.*, z.name AS zone_name
       FROM household h
       JOIN water_zone z ON z.id = h.zone_id
       WHERE h.deleted_at IS NULL
       ORDER BY z.name, h.street_address`
    );
    res.status(200).json({ households });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/people/households/:id — get one household
router.get('/households/:id', async (req, res) => {
  try {
    // Representatives can only view their own household
    const [households] = await db.query(
      `SELECT h.*, z.name AS zone_name
       FROM household h
       JOIN water_zone z ON z.id = h.zone_id
       WHERE h.id = ? AND h.deleted_at IS NULL`,
      [req.params.id]
    );
    if (households.length === 0) {
      return res.status(404).json({ error: 'Household not found.' });
    }
    // If representative, make sure they only see their own household
    if (req.user.role === 'representative') {
      const [member] = await db.query(
        `SELECT household_id FROM community_member WHERE id = ?`,
        [req.user.member_id]
      );
      if (member.length === 0 || member[0].household_id !== households[0].id) {
        return res.status(403).json({ error: 'Access denied.' });
      }
    }
    res.status(200).json({ household: households[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/people/households — create a household
router.post('/households', async (req, res) => {
  if (req.user.role === 'representative') {
    return res.status(403).json({ error: 'Access denied.' });
  }
  const { zone_id, house_number, street_address, landmark,
          member_count, connection_date } = req.body;
  if (!zone_id || !street_address || !connection_date) {
    return res.status(400).json({
      error: 'zone_id, street_address and connection_date are required.'
    });
  }
  // Zonal admin can only create in their own zone
  if (req.user.role === 'zonal_admin' && req.user.zone_id !== zone_id) {
    return res.status(403).json({ error: 'You can only create households in your zone.' });
  }
  try {
    const [result] = await db.query(
      `INSERT INTO household
         (zone_id, house_number, street_address, landmark,
          member_count, connection_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [zone_id, house_number || null, street_address,
       landmark || null, member_count || 1, connection_date]
    );
    await db.query(
      `INSERT INTO audit_log
         (user_id, action, table_name, record_id, new_values, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, 'household.create', 'household', result.insertId,
       JSON.stringify(req.body), getClientIp(req), req.headers['user-agent'] || null]
    );
    res.status(201).json({ message: 'Household created successfully.', id: result.insertId });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/people/households/:id — update a household
router.put('/households/:id', async (req, res) => {
  if (req.user.role === 'representative') {
    return res.status(403).json({ error: 'Access denied.' });
  }
  try {
    const [existing] = await db.query(
      `SELECT * FROM household WHERE id = ? AND deleted_at IS NULL`,
      [req.params.id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Household not found.' });
    }
    const h = existing[0];
    const { zone_id, house_number, street_address, landmark,
            member_count, connection_date, is_active } = req.body;
    await db.query(
      `UPDATE household SET
         zone_id = ?, house_number = ?, street_address = ?,
         landmark = ?, member_count = ?, connection_date = ?, is_active = ?
       WHERE id = ?`,
      [
        zone_id         || h.zone_id,
        house_number    || h.house_number,
        street_address  || h.street_address,
        landmark        || h.landmark,
        member_count    || h.member_count,
        connection_date || h.connection_date,
        is_active       !== undefined ? is_active : h.is_active,
        req.params.id
      ]
    );
    await db.query(
      `INSERT INTO audit_log
         (user_id, action, table_name, record_id, old_values, new_values, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, 'household.update', 'household', req.params.id,
       JSON.stringify(h), JSON.stringify(req.body),
       getClientIp(req), req.headers['user-agent'] || null]
    );
    res.status(200).json({ message: 'Household updated successfully.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/people/households/:id — soft delete
router.delete('/households/:id', async (req, res) => {
  if (req.user.role !== 'system_admin' && req.user.role !== 'zonal_admin') {
    return res.status(403).json({ error: 'Access denied.' });
  }
  try {
    const [existing] = await db.query(
      `SELECT * FROM household WHERE id = ? AND deleted_at IS NULL`,
      [req.params.id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Household not found.' });
    }
    await db.query(
      `UPDATE household SET deleted_at = NOW() WHERE id = ?`,
      [req.params.id]
    );
    await db.query(
      `INSERT INTO audit_log
         (user_id, action, table_name, record_id, old_values, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, 'household.delete', 'household', req.params.id,
       JSON.stringify(existing[0]), getClientIp(req), req.headers['user-agent'] || null]
    );
    res.status(200).json({ message: 'Household deleted successfully.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});


// ============================================================
// COMMUNITY MEMBER
// ============================================================

// GET /api/people/members — get all members
router.get('/members', async (req, res) => {
  if (req.user.role === 'representative') {
    return res.status(403).json({ error: 'Access denied.' });
  }
  try {
    const [members] = await db.query(
      `SELECT cm.*, h.street_address, h.house_number, z.name AS zone_name
       FROM community_member cm
       JOIN household h    ON h.id  = cm.household_id
       JOIN water_zone z   ON z.id  = h.zone_id
       WHERE cm.deleted_at IS NULL
       ORDER BY cm.last_name, cm.first_name`
    );
    res.status(200).json({ members });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/people/members/:id — get one member
router.get('/members/:id', async (req, res) => {
  if (req.user.role === 'representative') {
    return res.status(403).json({ error: 'Access denied.' });
  }
  try {
    const [members] = await db.query(
      `SELECT cm.*, h.street_address, h.house_number, z.name AS zone_name
       FROM community_member cm
       JOIN household h  ON h.id = cm.household_id
       JOIN water_zone z ON z.id = h.zone_id
       WHERE cm.id = ? AND cm.deleted_at IS NULL`,
      [req.params.id]
    );
    if (members.length === 0) {
      return res.status(404).json({ error: 'Member not found.' });
    }
    res.status(200).json({ member: members[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/people/households/:id/members — get all members of a household
router.get('/households/:id/members', async (req, res) => {
  try {
    const [members] = await db.query(
      `SELECT * FROM community_member
       WHERE household_id = ? AND deleted_at IS NULL
       ORDER BY is_representative DESC, last_name`,
      [req.params.id]
    );
    res.status(200).json({ members });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/people/members — add a new member
router.post('/members', async (req, res) => {
  if (req.user.role === 'representative') {
    return res.status(403).json({ error: 'Access denied.' });
  }
  const { household_id, first_name, last_name, phone, email,
          national_id, gender, date_of_birth, is_representative } = req.body;
  if (!household_id || !first_name || !last_name) {
    return res.status(400).json({
      error: 'household_id, first_name and last_name are required.'
    });
  }
  try {
    const [result] = await db.query(
      `INSERT INTO community_member
         (household_id, first_name, last_name, phone, email,
          national_id, gender, date_of_birth, is_representative)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [household_id, first_name, last_name, phone || null, email || null,
       national_id || null, gender || null, date_of_birth || null,
       is_representative || 0]
    );
    // Update household member count
    await db.query(
      `UPDATE household
       SET member_count = (
         SELECT COUNT(*) FROM community_member
         WHERE household_id = ? AND deleted_at IS NULL
       )
       WHERE id = ?`,
      [household_id, household_id]
    );
    await db.query(
      `INSERT INTO audit_log
         (user_id, action, table_name, record_id, new_values, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, 'community_member.create', 'community_member', result.insertId,
       JSON.stringify(req.body), getClientIp(req), req.headers['user-agent'] || null]
    );
    res.status(201).json({ message: 'Member added successfully.', id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_SIGNAL_EXCEPTION') {
      return res.status(409).json({ error: err.sqlMessage });
    }
    console.error(err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/people/members/:id — update a member
router.put('/members/:id', async (req, res) => {
  if (req.user.role === 'representative') {
    return res.status(403).json({ error: 'Access denied.' });
  }
  try {
    const [existing] = await db.query(
      `SELECT * FROM community_member WHERE id = ? AND deleted_at IS NULL`,
      [req.params.id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Member not found.' });
    }
    const m = existing[0];
    const { first_name, last_name, phone, email, national_id,
            gender, date_of_birth, is_active } = req.body;
    await db.query(
      `UPDATE community_member SET
         first_name = ?, last_name = ?, phone = ?, email = ?,
         national_id = ?, gender = ?, date_of_birth = ?, is_active = ?
       WHERE id = ?`,
      [
        first_name    || m.first_name,
        last_name     || m.last_name,
        phone         || m.phone,
        email         || m.email,
        national_id   || m.national_id,
        gender        || m.gender,
        date_of_birth || m.date_of_birth,
        is_active     !== undefined ? is_active : m.is_active,
        req.params.id
      ]
    );
    await db.query(
      `INSERT INTO audit_log
         (user_id, action, table_name, record_id, old_values, new_values, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, 'community_member.update', 'community_member', req.params.id,
       JSON.stringify(m), JSON.stringify(req.body),
       getClientIp(req), req.headers['user-agent'] || null]
    );
    res.status(200).json({ message: 'Member updated successfully.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/people/members/:id — soft delete
router.delete('/members/:id', async (req, res) => {
  if (req.user.role === 'representative') {
    return res.status(403).json({ error: 'Access denied.' });
  }
  try {
    const [existing] = await db.query(
      `SELECT * FROM community_member WHERE id = ? AND deleted_at IS NULL`,
      [req.params.id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Member not found.' });
    }
    if (existing[0].is_representative === 1) {
      return res.status(400).json({
        error: 'Cannot delete a household representative. Reassign the representative first.'
      });
    }
    await db.query(
      `UPDATE community_member SET deleted_at = NOW() WHERE id = ?`,
      [req.params.id]
    );
    // Update household member count
    await db.query(
      `UPDATE household
       SET member_count = (
         SELECT COUNT(*) FROM community_member
         WHERE household_id = ? AND deleted_at IS NULL
       )
       WHERE id = ?`,
      [existing[0].household_id, existing[0].household_id]
    );
    await db.query(
      `INSERT INTO audit_log
         (user_id, action, table_name, record_id, old_values, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, 'community_member.delete', 'community_member', req.params.id,
       JSON.stringify(existing[0]), getClientIp(req), req.headers['user-agent'] || null]
    );
    res.status(200).json({ message: 'Member deleted successfully.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});


// ============================================================
// COMMITTEE MEMBER
// ============================================================

// GET /api/people/committee — get all committee members
router.get('/committee', async (req, res) => {
  try {
    const [committee] = await db.query(
      `SELECT cm.*, 
              c.first_name, c.last_name, c.phone, c.email,
              h.street_address, z.name AS zone_name
       FROM committee_member cm
       JOIN community_member c ON c.id  = cm.member_id
       JOIN household h        ON h.id  = c.household_id
       JOIN water_zone z       ON z.id  = h.zone_id
       WHERE cm.is_active = 1
       ORDER BY cm.role`
    );
    res.status(200).json({ committee });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/people/committee/:id — get one committee member
router.get('/committee/:id', async (req, res) => {
  try {
    const [committee] = await db.query(
      `SELECT cm.*,
              c.first_name, c.last_name, c.phone, c.email,
              h.street_address, z.name AS zone_name
       FROM committee_member cm
       JOIN community_member c ON c.id = cm.member_id
       JOIN household h        ON h.id = c.household_id
       JOIN water_zone z       ON z.id = h.zone_id
       WHERE cm.id = ?`,
      [req.params.id]
    );
    if (committee.length === 0) {
      return res.status(404).json({ error: 'Committee member not found.' });
    }
    res.status(200).json({ committee_member: committee[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/people/committee — add a committee member
router.post('/committee', async (req, res) => {
  if (req.user.role === 'representative') {
    return res.status(403).json({ error: 'Access denied.' });
  }
  const { member_id, role, start_date } = req.body;
  if (!member_id || !role || !start_date) {
    return res.status(400).json({
      error: 'member_id, role and start_date are required.'
    });
  }
  try {
    const [result] = await db.query(
      `INSERT INTO committee_member (member_id, role, start_date)
       VALUES (?, ?, ?)`,
      [member_id, role, start_date]
    );
    // Update is_committee_member flag on community_member
    await db.query(
      `UPDATE community_member SET is_committee_member = 1 WHERE id = ?`,
      [member_id]
    );
    await db.query(
      `INSERT INTO audit_log
         (user_id, action, table_name, record_id, new_values, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, 'committee_member.create', 'committee_member', result.insertId,
       JSON.stringify(req.body), getClientIp(req), req.headers['user-agent'] || null]
    );
    res.status(201).json({ message: 'Committee member added successfully.', id: result.insertId });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/people/committee/:id — update a committee member
router.put('/committee/:id', async (req, res) => {
  if (req.user.role === 'representative') {
    return res.status(403).json({ error: 'Access denied.' });
  }
  try {
    const [existing] = await db.query(
      `SELECT * FROM committee_member WHERE id = ?`, [req.params.id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Committee member not found.' });
    }
    const c = existing[0];
    const { role, start_date, end_date, is_active } = req.body;
    await db.query(
      `UPDATE committee_member SET
         role = ?, start_date = ?, end_date = ?, is_active = ?
       WHERE id = ?`,
      [
        role       || c.role,
        start_date || c.start_date,
        end_date   || c.end_date,
        is_active  !== undefined ? is_active : c.is_active,
        req.params.id
      ]
    );
    await db.query(
      `INSERT INTO audit_log
         (user_id, action, table_name, record_id, old_values, new_values, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, 'committee_member.update', 'committee_member', req.params.id,
       JSON.stringify(c), JSON.stringify(req.body),
       getClientIp(req), req.headers['user-agent'] || null]
    );
    res.status(200).json({ message: 'Committee member updated successfully.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/people/committee/:id — deactivate a committee member
router.delete('/committee/:id', async (req, res) => {
  if (req.user.role === 'representative') {
    return res.status(403).json({ error: 'Access denied.' });
  }
  try {
    const [existing] = await db.query(
      `SELECT * FROM committee_member WHERE id = ?`, [req.params.id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Committee member not found.' });
    }
    await db.query(
      `UPDATE committee_member
       SET is_active = 0, end_date = CURDATE()
       WHERE id = ?`,
      [req.params.id]
    );
    // Remove is_committee_member flag from community_member
    await db.query(
      `UPDATE community_member SET is_committee_member = 0
       WHERE id = ?`,
      [existing[0].member_id]
    );
    await db.query(
      `INSERT INTO audit_log
         (user_id, action, table_name, record_id, old_values, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, 'committee_member.delete', 'committee_member', req.params.id,
       JSON.stringify(existing[0]), getClientIp(req), req.headers['user-agent'] || null]
    );
    res.status(200).json({ message: 'Committee member deactivated successfully.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});


// ============================================================
// USER MANAGEMENT
// ============================================================

// GET /api/people/users — get all users (system_admin only)
router.get('/users', async (req, res) => {
  if (req.user.role !== 'system_admin') {
    return res.status(403).json({ error: 'Access denied.' });
  }
  try {
    const [users] = await db.query(
      `SELECT u.id, u.username, u.email, u.role, u.is_active,
              u.zone_id, u.member_id, u.last_login_at, u.created_at,
              z.name AS zone_name,
              cm.first_name, cm.last_name
       FROM user u
       LEFT JOIN water_zone z       ON z.id  = u.zone_id
       LEFT JOIN community_member cm ON cm.id = u.member_id
       WHERE u.deleted_at IS NULL
       ORDER BY u.role, u.username`
    );
    res.status(200).json({ users });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/people/users/zonal — get all zonal admins
router.get('/users/zonal', async (req, res) => {
  if (req.user.role === 'representative') {
    return res.status(403).json({ error: 'Access denied.' });
  }
  try {
    const [users] = await db.query(
      `SELECT u.id, u.username, u.email, u.role,
              u.zone_id, u.is_active, u.last_login_at,
              z.name AS zone_name
       FROM user u
       LEFT JOIN water_zone z ON z.id = u.zone_id
       WHERE u.role = 'zonal_admin'
         AND u.deleted_at IS NULL
       ORDER BY z.name`
    );
    res.status(200).json({ zonal_admins: users });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/people/users — create a new user
router.post('/users', async (req, res) => {
  if (req.user.role === 'representative') {
    return res.status(403).json({ error: 'Access denied.' });
  }
  const { member_id, zone_id, username, email, password, role } = req.body;
  if (!username || !email || !password || !role) {
    return res.status(400).json({
      error: 'username, email, password and role are required.'
    });
  }
  // Zonal admin can only create zonal_admin or representative
  if (req.user.role === 'zonal_admin' && role === 'system_admin') {
    return res.status(403).json({ error: 'You cannot create a system admin.' });
  }
  // Zonal admin can only create users for their own zone
  if (req.user.role === 'zonal_admin' && zone_id && zone_id !== req.user.zone_id) {
    return res.status(403).json({ error: 'You can only create users for your zone.' });
  }
  try {
    const password_hash = await bcrypt.hash(password, 12);
    const [result] = await db.query(
      `INSERT INTO user
         (member_id, zone_id, username, email, password_hash, role, must_change_password)
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [member_id || null, zone_id || null, username, email, password_hash, role]
    );
    await db.query(
      `INSERT INTO audit_log
         (user_id, action, table_name, record_id, new_values, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, 'user.create', 'user', result.insertId,
       JSON.stringify({ username, email, role, zone_id }),
       getClientIp(req), req.headers['user-agent'] || null]
    );
    res.status(201).json({ message: 'User created successfully.', id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Username or email already exists.' });
    }
    console.error(err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/people/users/:id — soft delete a user
router.delete('/users/:id', async (req, res) => {
  if (req.user.role === 'representative') {
    return res.status(403).json({ error: 'Access denied.' });
  }
  try {
    const [existing] = await db.query(
      `SELECT * FROM user WHERE id = ? AND deleted_at IS NULL`,
      [req.params.id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }
    const targetUser = existing[0];

    // Zonal admin self-deletion rule:
    // Must have at least one other active zonal admin in their zone
    if (
      req.user.role === 'zonal_admin' &&
      parseInt(req.params.id) === req.user.id
    ) {
      const [otherAdmins] = await db.query(
        `SELECT id FROM user
         WHERE role = 'zonal_admin'
           AND zone_id = ?
           AND id != ?
           AND is_active = 1
           AND deleted_at IS NULL`,
        [req.user.zone_id, req.user.id]
      );
      if (otherAdmins.length === 0) {
        return res.status(400).json({
          error: 'You must create a successor zonal admin before deleting your account.'
        });
      }
    }

    await db.query(
      `UPDATE user SET deleted_at = NOW(), is_active = 0 WHERE id = ?`,
      [req.params.id]
    );
    // Revoke all active sessions for this user
    await db.query(
      `UPDATE user_session SET revoked_at = NOW()
       WHERE user_id = ? AND revoked_at IS NULL`,
      [req.params.id]
    );
    await db.query(
      `INSERT INTO audit_log
         (user_id, action, table_name, record_id, old_values, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, 'user.delete', 'user', req.params.id,
       JSON.stringify({ username: targetUser.username, role: targetUser.role }),
       getClientIp(req), req.headers['user-agent'] || null]
    );
    res.status(200).json({ message: 'User deleted successfully.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});


module.exports = router;