const express = require('express');
const { pool } = require('../db');
const { requireAuth } = require('../auth');

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const { rows } = await pool.query('SELECT key, value FROM settings WHERE user_id = $1', [req.user.id]);
  const map = {};
  rows.forEach(r => { map[r.key] = r.value; });
  if (!map.bankroll)     map.bankroll     = '1000';
  if (!map.streak_alert) map.streak_alert = '3';
  if (!map.goal)         map.goal         = '';
  res.json(map);
});

router.post('/', async (req, res) => {
  const entries = Object.entries(req.body || {});
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const [key, value] of entries) {
      await client.query(
        `INSERT INTO settings (user_id, key, value) VALUES ($1, $2, $3)
         ON CONFLICT (user_id, key) DO UPDATE SET value = EXCLUDED.value`,
        [req.user.id, key, String(value)]
      );
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
  res.json({ ok: true });
});

module.exports = router;
