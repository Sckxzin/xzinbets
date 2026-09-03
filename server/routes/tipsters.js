const express = require('express');
const { pool } = require('../db');
const { requireAuth } = require('../auth');
const { calcProfit } = require('../stats');

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM tipsters WHERE user_id = $1 ORDER BY name', [req.user.id]);
  res.json(rows);
});

router.get('/stats', async (req, res) => {
  const { rows: tipsters } = await pool.query('SELECT * FROM tipsters WHERE user_id = $1 ORDER BY name', [req.user.id]);
  const { rows: bets } = await pool.query('SELECT * FROM bets WHERE user_id = $1', [req.user.id]);

  const stats = tipsters.map(t => {
    const tb      = bets.filter(b => b.tipster_id === t.id);
    const settled = tb.filter(b => b.result === 'won' || b.result === 'lost');
    const won     = settled.filter(b => b.result === 'won');
    const profit  = settled.reduce((s, b) => s + calcProfit(b), 0);
    const stake   = settled.reduce((s, b) => s + parseFloat(b.stake), 0);
    return {
      ...t, total: tb.length, settled: settled.length, won: won.length,
      profit: +profit.toFixed(2), roi: stake > 0 ? +(profit / stake * 100).toFixed(1) : 0,
      winRate: settled.length > 0 ? +(won.length / settled.length * 100).toFixed(1) : 0,
    };
  });
  res.json(stats);
});

router.post('/', async (req, res) => {
  const { name, notes } = req.body || {};
  if (!name) return res.status(400).json({ error: 'Nome é obrigatório.' });
  const { rows } = await pool.query(
    'INSERT INTO tipsters (user_id, name, notes) VALUES ($1, $2, $3) RETURNING *',
    [req.user.id, name, notes || '']
  );
  res.status(201).json(rows[0]);
});

router.put('/:id', async (req, res) => {
  const { name, notes } = req.body || {};
  const { rows } = await pool.query(
    'UPDATE tipsters SET name = $1, notes = $2 WHERE id = $3 AND user_id = $4 RETURNING *',
    [name, notes, req.params.id, req.user.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Tipster não encontrado.' });
  res.json(rows[0]);
});

router.delete('/:id', async (req, res) => {
  await pool.query('UPDATE bets SET tipster_id = NULL WHERE tipster_id = $1 AND user_id = $2', [req.params.id, req.user.id]);
  await pool.query('DELETE FROM tipsters WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
  res.json({ ok: true });
});

module.exports = router;
