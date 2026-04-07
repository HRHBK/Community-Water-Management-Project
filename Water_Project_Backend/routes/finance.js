const express        = require('express');
const db             = require('../config/db');
const authMiddleware = require('../middleware/auth');
const getClientIp    = require('../config/getClientIp');

const router = express.Router();

router.use(authMiddleware);


// ============================================================
// SUBSCRIPTION RATE
// ============================================================

// GET /api/finance/rates — get all rates
router.get('/rates', async (req, res) => {
  try {
    const [rates] = await db.query(
      `SELECT sr.*, u.username AS set_by_username
       FROM subscription_rate sr
       LEFT JOIN user u ON u.id = sr.set_by
       ORDER BY sr.year DESC`
    );
    res.status(200).json({ rates });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/finance/rates — create a new rate (system_admin only)
router.post('/rates', async (req, res) => {
  if (req.user.role !== 'system_admin') {
    return res.status(403).json({ error: 'Access denied.' });
  }
  const { year, rate_per_person, notes } = req.body;
  if (!year || !rate_per_person) {
    return res.status(400).json({ error: 'year and rate_per_person are required.' });
  }
  try {
    const [result] = await db.query(
      `INSERT INTO subscription_rate (year, rate_per_person, set_by, notes)
       VALUES (?, ?, ?, ?)`,
      [year, rate_per_person, req.user.id, notes || null]
    );
    await db.query(
      `INSERT INTO audit_log
         (user_id, action, table_name, record_id, new_values, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, 'subscription_rate.create', 'subscription_rate', result.insertId,
       JSON.stringify(req.body), getClientIp(req), req.headers['user-agent'] || null]
    );
    res.status(201).json({ message: 'Subscription rate created successfully.', id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'A rate for this year already exists.' });
    }
    console.error(err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});


// ============================================================
// SUBSCRIPTION
// ============================================================

// GET /api/finance/subscriptions — get all subscriptions
router.get('/subscriptions', async (req, res) => {
  if (req.user.role === 'representative') {
    return res.status(403).json({ error: 'Access denied.' });
  }
  try {
    const [subscriptions] = await db.query(
      `SELECT * FROM v_subscription_status ORDER BY year DESC, zone, street_address`
    );
    res.status(200).json({ subscriptions });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/finance/subscriptions/household/:id — get all subscriptions for one household
router.get('/subscriptions/household/:id', async (req, res) => {
  try {
    // Representatives can only view their own household
    if (req.user.role === 'representative') {
      const [member] = await db.query(
        `SELECT household_id FROM community_member WHERE id = ?`,
        [req.user.member_id]
      );
      if (member.length === 0 || member[0].household_id !== parseInt(req.params.id)) {
        return res.status(403).json({ error: 'Access denied.' });
      }
    }
    const [subscriptions] = await db.query(
      `SELECT * FROM v_subscription_status
       WHERE household_id = ?
       ORDER BY year DESC`,
      [req.params.id]
    );
    res.status(200).json({ subscriptions });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/finance/subscriptions — create subscriptions for a year
router.post('/subscriptions', async (req, res) => {
  if (req.user.role === 'representative') {
    return res.status(403).json({ error: 'Access denied.' });
  }
  const { household_id, year } = req.body;
  if (!household_id || !year) {
    return res.status(400).json({ error: 'household_id and year are required.' });
  }
  try {
    // Get the rate for this year
    const [rates] = await db.query(
      `SELECT * FROM subscription_rate WHERE year = ?`, [year]
    );
    if (rates.length === 0) {
      return res.status(404).json({ error: `No subscription rate found for year ${year}.` });
    }
    const rate = rates[0];

    // Get household member count
    const [households] = await db.query(
      `SELECT * FROM household WHERE id = ? AND deleted_at IS NULL`, [household_id]
    );
    if (households.length === 0) {
      return res.status(404).json({ error: 'Household not found.' });
    }
    const household = households[0];
    const amount_due = household.member_count * rate.rate_per_person;

    const [result] = await db.query(
      `INSERT INTO subscription
         (household_id, rate_id, year, member_count, rate_per_person, amount_due, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [household_id, rate.id, year, household.member_count,
       rate.rate_per_person, amount_due, req.user.id]
    );
    await db.query(
      `INSERT INTO audit_log
         (user_id, action, table_name, record_id, new_values, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, 'subscription.create', 'subscription', result.insertId,
       JSON.stringify({ household_id, year, amount_due }),
       getClientIp(req), req.headers['user-agent'] || null]
    );
    res.status(201).json({
      message: 'Subscription created successfully.',
      id:          result.insertId,
      amount_due,
      member_count: household.member_count,
      rate_per_person: rate.rate_per_person
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        error: 'A subscription for this household and year already exists.'
      });
    }
    console.error(err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});


// ============================================================
// SUBSCRIPTION PAYMENT
// ============================================================

// GET /api/finance/payments — get all payments
router.get('/payments', async (req, res) => {
  if (req.user.role === 'representative') {
    return res.status(403).json({ error: 'Access denied.' });
  }
  try {
    const [payments] = await db.query(
      `SELECT sp.*,
              h.street_address, h.house_number,
              z.name AS zone_name,
              s.year, s.amount_due,
              CONCAT(cm.first_name, ' ', cm.last_name) AS received_by_name
       FROM subscription_payment sp
       JOIN subscription s         ON s.id  = sp.subscription_id
       JOIN household h            ON h.id  = s.household_id
       JOIN water_zone z           ON z.id  = h.zone_id
       LEFT JOIN committee_member cmt ON cmt.id = sp.received_by
       LEFT JOIN community_member cm  ON cm.id  = cmt.member_id
       ORDER BY sp.payment_date DESC`
    );
    res.status(200).json({ payments });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/finance/payments/subscription/:id — get payments for one subscription
router.get('/payments/subscription/:id', async (req, res) => {
  try {
    const [payments] = await db.query(
      `SELECT sp.*,
              CONCAT(cm.first_name, ' ', cm.last_name) AS received_by_name
       FROM subscription_payment sp
       LEFT JOIN committee_member cmt ON cmt.id = sp.received_by
       LEFT JOIN community_member cm  ON cm.id  = cmt.member_id
       WHERE sp.subscription_id = ?
       ORDER BY sp.payment_date ASC`,
      [req.params.id]
    );
    res.status(200).json({ payments });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/finance/payments — record a payment
router.post('/payments', async (req, res) => {
  if (req.user.role === 'representative') {
    return res.status(403).json({ error: 'Access denied.' });
  }
  const { subscription_id, amount, payment_date,
          payment_method, reference, received_by } = req.body;
  if (!subscription_id || !amount || !payment_date) {
    return res.status(400).json({
      error: 'subscription_id, amount and payment_date are required.'
    });
  }
  try {
    // Check subscription exists
    const [subscriptions] = await db.query(
      `SELECT * FROM subscription WHERE id = ?`, [subscription_id]
    );
    if (subscriptions.length === 0) {
      return res.status(404).json({ error: 'Subscription not found.' });
    }

    // Check payment does not exceed balance
    const [totals] = await db.query(
      `SELECT COALESCE(SUM(amount), 0) AS total_paid
       FROM subscription_payment
       WHERE subscription_id = ?`,
      [subscription_id]
    );
    const balance = subscriptions[0].amount_due - totals[0].total_paid;
    if (amount > balance) {
      return res.status(400).json({
        error: `Payment amount (${amount}) exceeds the remaining balance (${balance}).`
      });
    }

    const [result] = await db.query(
      `INSERT INTO subscription_payment
         (subscription_id, amount, payment_date, payment_method, reference, received_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [subscription_id, amount, payment_date,
       payment_method || 'cash', reference || null, received_by || null]
    );
    await db.query(
      `INSERT INTO audit_log
         (user_id, action, table_name, record_id, new_values, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, 'subscription_payment.create', 'subscription_payment', result.insertId,
       JSON.stringify(req.body), getClientIp(req), req.headers['user-agent'] || null]
    );
    res.status(201).json({ message: 'Payment recorded successfully.', id: result.insertId });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});


// ============================================================
// MAINTENANCE WORK
// ============================================================

// GET /api/finance/maintenance — get all maintenance jobs
router.get('/maintenance', async (req, res) => {
  if (req.user.role === 'representative') {
    return res.status(403).json({ error: 'Access denied.' });
  }
  try {
    const [jobs] = await db.query(
      `SELECT * FROM v_maintenance_summary ORDER BY work_date DESC`
    );
    res.status(200).json({ maintenance: jobs });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/finance/maintenance/:id — get one maintenance job with cost breakdown
router.get('/maintenance/:id', async (req, res) => {
  if (req.user.role === 'representative') {
    return res.status(403).json({ error: 'Access denied.' });
  }
  try {
    const [jobs] = await db.query(
      `SELECT * FROM v_maintenance_summary WHERE id = ?`,
      [req.params.id]
    );
    if (jobs.length === 0) {
      return res.status(404).json({ error: 'Maintenance job not found.' });
    }
    const [costs] = await db.query(
      `SELECT * FROM maintenance_cost WHERE maintenance_work_id = ?`,
      [req.params.id]
    );
    res.status(200).json({ job: jobs[0], costs });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});
// POST /api/finance/maintenance — create a maintenance job
router.post('/maintenance', async (req, res) => {
  if (req.user.role === 'representative') {
    return res.status(403).json({ error: 'Access denied.' });
  }
  const { tap_id, tank_id, title, description,
          work_date, status, performed_by } = req.body;
  if (!title || !work_date) {
    return res.status(400).json({ error: 'title and work_date are required.' });
  }
  if (!tap_id && !tank_id) {
    return res.status(400).json({ error: 'Either tap_id or tank_id is required.' });
  }
  if (tap_id && tank_id) {
    return res.status(400).json({ error: 'Only one of tap_id or tank_id can be set, not both.' });
  }
  try {
    const [result] = await db.query(
      `INSERT INTO maintenance_work
         (tap_id, tank_id, title, description, work_date, status, performed_by, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [tap_id || null, tank_id || null, title, description || null,
       work_date, status || 'pending', performed_by || null, req.user.id]
    );
    await db.query(
      `INSERT INTO audit_log
         (user_id, action, table_name, record_id, new_values, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, 'maintenance_work.create', 'maintenance_work', result.insertId,
       JSON.stringify(req.body), getClientIp(req), req.headers['user-agent'] || null]
    );
    res.status(201).json({ message: 'Maintenance job created successfully.', id: result.insertId });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/finance/maintenance/:id — update a maintenance job
router.put('/maintenance/:id', async (req, res) => {
  if (req.user.role === 'representative') {
    return res.status(403).json({ error: 'Access denied.' });
  }
  try {
    const [existing] = await db.query(
      `SELECT * FROM maintenance_work WHERE id = ?`, [req.params.id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Maintenance job not found.' });
    }
    const j = existing[0];
    const { title, description, work_date, status, performed_by } = req.body;
    await db.query(
      `UPDATE maintenance_work SET
         title = ?, description = ?, work_date = ?,
         status = ?, performed_by = ?
       WHERE id = ?`,
      [
        title        || j.title,
        description  || j.description,
        work_date    || j.work_date,
        status       || j.status,
        performed_by !== undefined ? performed_by : j.performed_by,
        req.params.id
      ]
    );
    await db.query(
      `INSERT INTO audit_log
         (user_id, action, table_name, record_id, old_values, new_values, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, 'maintenance_work.update', 'maintenance_work', req.params.id,
       JSON.stringify(j), JSON.stringify(req.body),
       getClientIp(req), req.headers['user-agent'] || null]
    );
    res.status(200).json({ message: 'Maintenance job updated successfully.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/finance/maintenance/:id/costs — add a cost line to a job
router.post('/maintenance/:id/costs', async (req, res) => {
  if (req.user.role === 'representative') {
    return res.status(403).json({ error: 'Access denied.' });
  }
  const { description, quantity, unit_cost } = req.body;
  if (!description || !unit_cost) {
    return res.status(400).json({ error: 'description and unit_cost are required.' });
  }
  try {
    const [result] = await db.query(
      `INSERT INTO maintenance_cost
         (maintenance_work_id, description, quantity, unit_cost)
       VALUES (?, ?, ?, ?)`,
      [req.params.id, description, quantity || 1, unit_cost]
    );
    res.status(201).json({ message: 'Cost line added successfully.', id: result.insertId });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});


// ============================================================
// EXPENDITURE CATEGORY
// ============================================================

// GET /api/finance/categories — get all categories
router.get('/categories', async (req, res) => {
  try {
    const [categories] = await db.query(
      `SELECT * FROM expenditure_category WHERE is_active = 1 ORDER BY name`
    );
    res.status(200).json({ categories });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/finance/categories — create a category
router.post('/categories', async (req, res) => {
  if (req.user.role !== 'system_admin') {
    return res.status(403).json({ error: 'Access denied.' });
  }
  const { name, description } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'name is required.' });
  }
  try {
    const [result] = await db.query(
      `INSERT INTO expenditure_category (name, description) VALUES (?, ?)`,
      [name, description || null]
    );
    res.status(201).json({ message: 'Category created successfully.', id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'A category with this name already exists.' });
    }
    console.error(err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});


// ============================================================
// EXPENDITURE
// ============================================================

// GET /api/finance/expenditures — get all expenditures
router.get('/expenditures', async (req, res) => {
  if (req.user.role === 'representative') {
    return res.status(403).json({ error: 'Access denied.' });
  }
  try {
    const [expenditures] = await db.query(
      `SELECT e.*,
              ec.name AS category_name,
              CONCAT(ca.first_name, ' ', ca.last_name) AS approved_by_name,
              CONCAT(cr.first_name, ' ', cr.last_name) AS recorded_by_name
       FROM expenditure e
       JOIN expenditure_category ec  ON ec.id  = e.category_id
       LEFT JOIN committee_member cma ON cma.id = e.approved_by
       LEFT JOIN community_member ca  ON ca.id  = cma.member_id
       LEFT JOIN committee_member cmr ON cmr.id = e.recorded_by
       LEFT JOIN community_member cr  ON cr.id  = cmr.member_id
       ORDER BY e.expenditure_date DESC`
    );
    res.status(200).json({ expenditures });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/finance/expenditures — record an expenditure
router.post('/expenditures', async (req, res) => {
  if (req.user.role === 'representative') {
    return res.status(403).json({ error: 'Access denied.' });
  }
  const { category_id, description, amount, expenditure_date,
          payment_method, reference, approved_by, recorded_by } = req.body;
  if (!category_id || !description || !amount || !expenditure_date) {
    return res.status(400).json({
      error: 'category_id, description, amount and expenditure_date are required.'
    });
  }
  try {
    const [result] = await db.query(
      `INSERT INTO expenditure
         (category_id, description, amount, expenditure_date,
          payment_method, reference, approved_by, recorded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [category_id, description, amount, expenditure_date,
       payment_method || 'cash', reference || null,
       approved_by || null, recorded_by || null]
    );
    await db.query(
      `INSERT INTO audit_log
         (user_id, action, table_name, record_id, new_values, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, 'expenditure.create', 'expenditure', result.insertId,
       JSON.stringify(req.body), getClientIp(req), req.headers['user-agent'] || null]
    );
    res.status(201).json({ message: 'Expenditure recorded successfully.', id: result.insertId });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/finance/expenditures/:id — update an expenditure
router.put('/expenditures/:id', async (req, res) => {
  if (req.user.role === 'representative') {
    return res.status(403).json({ error: 'Access denied.' });
  }
  try {
    const [existing] = await db.query(
      `SELECT * FROM expenditure WHERE id = ?`, [req.params.id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Expenditure not found.' });
    }
    const e = existing[0];
    const { category_id, description, amount, expenditure_date,
            payment_method, reference, approved_by, recorded_by } = req.body;
    await db.query(
      `UPDATE expenditure SET
         category_id = ?, description = ?, amount = ?,
         expenditure_date = ?, payment_method = ?,
         reference = ?, approved_by = ?, recorded_by = ?
       WHERE id = ?`,
      [
        category_id      || e.category_id,
        description      || e.description,
        amount           || e.amount,
        expenditure_date || e.expenditure_date,
        payment_method   || e.payment_method,
        reference        || e.reference,
        approved_by      || e.approved_by,
        recorded_by      || e.recorded_by,
        req.params.id
      ]
    );
    await db.query(
      `INSERT INTO audit_log
         (user_id, action, table_name, record_id, old_values, new_values, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, 'expenditure.update', 'expenditure', req.params.id,
       JSON.stringify(e), JSON.stringify(req.body),
       getClientIp(req), req.headers['user-agent'] || null]
    );
    res.status(200).json({ message: 'Expenditure updated successfully.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});


// ============================================================
// COMMITTEE PAYMENT
// ============================================================

// GET /api/finance/committee-payments — get all committee payments
router.get('/committee-payments', async (req, res) => {
  if (req.user.role === 'representative') {
    return res.status(403).json({ error: 'Access denied.' });
  }
  try {
    const [payments] = await db.query(
      `SELECT cp.*,
              CONCAT(cm.first_name, ' ', cm.last_name) AS member_name,
              CONCAT(ca.first_name, ' ', ca.last_name) AS approved_by_name,
              CONCAT(cr.first_name, ' ', cr.last_name) AS recorded_by_name
       FROM committee_payment cp
       JOIN committee_member cmt  ON cmt.id = cp.committee_member_id
       JOIN community_member cm   ON cm.id  = cmt.member_id
       LEFT JOIN committee_member cma ON cma.id = cp.approved_by
       LEFT JOIN community_member ca  ON ca.id  = cma.member_id
       LEFT JOIN committee_member cmr ON cmr.id = cp.recorded_by
       LEFT JOIN community_member cr  ON cr.id  = cmr.member_id
       ORDER BY cp.payment_date DESC`
    );
    res.status(200).json({ payments });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/finance/committee-payments — record a committee payment
router.post('/committee-payments', async (req, res) => {
  if (req.user.role === 'representative') {
    return res.status(403).json({ error: 'Access denied.' });
  }
  const { committee_member_id, payment_type, amount, payment_date,
          payment_method, reference, approved_by, recorded_by, description } = req.body;
  if (!committee_member_id || !amount || !payment_date) {
    return res.status(400).json({
      error: 'committee_member_id, amount and payment_date are required.'
    });
  }
  try {
    const [result] = await db.query(
      `INSERT INTO committee_payment
         (committee_member_id, payment_type, amount, payment_date,
          payment_method, reference, approved_by, recorded_by, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [committee_member_id, payment_type || 'other', amount, payment_date,
       payment_method || 'cash', reference || null,
       approved_by || null, recorded_by || null, description || null]
    );
    await db.query(
      `INSERT INTO audit_log
         (user_id, action, table_name, record_id, new_values, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, 'committee_payment.create', 'committee_payment', result.insertId,
       JSON.stringify(req.body), getClientIp(req), req.headers['user-agent'] || null]
    );
    res.status(201).json({ message: 'Committee payment recorded successfully.', id: result.insertId });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});


// ============================================================
// FINANCE SUMMARY (Dashboard data)
// ============================================================

// GET /api/finance/summary — annual income vs expenditure
router.get('/summary', async (req, res) => {
  if (req.user.role === 'representative') {
    return res.status(403).json({ error: 'Access denied.' });
  }
  try {
    const [summary] = await db.query(
      `SELECT * FROM v_annual_finance`
    );
    res.status(200).json({ summary });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/finance/summary/:year — summary for a specific year
router.get('/summary/:year', async (req, res) => {
  if (req.user.role === 'representative') {
    return res.status(403).json({ error: 'Access denied.' });
  }
  try {
    const [summary] = await db.query(
      `SELECT * FROM v_annual_finance WHERE yr = ?`, [req.params.year]
    );
    if (summary.length === 0) {
      return res.status(404).json({ error: `No financial data found for year ${req.params.year}.` });
    }

    // Subscription breakdown for this year
    const [subscriptionStats] = await db.query(
      `SELECT
         COUNT(*)                                      AS total_households,
         SUM(amount_due)                               AS total_billed,
         SUM(amount_paid)                              AS total_collected,
         SUM(balance)                                  AS total_outstanding,
         SUM(CASE WHEN status = 'paid'    THEN 1 ELSE 0 END) AS paid_count,
         SUM(CASE WHEN status = 'partial' THEN 1 ELSE 0 END) AS partial_count,
         SUM(CASE WHEN status = 'unpaid'  THEN 1 ELSE 0 END) AS unpaid_count
       FROM v_subscription_status
       WHERE year = ?`,
      [req.params.year]
    );

    // Expenditure breakdown for this year
    const [expenditureStats] = await db.query(
      `SELECT ec.name AS category, SUM(e.amount) AS total
       FROM expenditure e
       JOIN expenditure_category ec ON ec.id = e.category_id
       WHERE YEAR(e.expenditure_date) = ?
       GROUP BY ec.name
       ORDER BY total DESC`,
      [req.params.year]
    );

    res.status(200).json({
      year:                req.params.year,
      finance_summary:     summary[0],
      subscription_stats:  subscriptionStats[0],
      expenditure_by_category: expenditureStats
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});


module.exports = router;