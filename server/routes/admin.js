const express = require('express');
const { pool } = require('../db');
const { requireAuth, requireAdmin, hashPassword } = require('../auth');
const { calcProfit } = require('../stats');

const router = express.Router();
router.use(requireAuth, requireAdmin);

router.get('/stats', async (req, res) => {
  const { rows: users } = await pool.query('SELECT id, email, is_admin, created_at FROM users ORDER BY created_at');
  const { rows: bets }  = await pool.query('SELECT * FROM bets');

  const usersWithStats = users.map(u => {
    const ub      = bets.filter(b => b.user_id === u.id);
    const settled = ub.filter(b => b.result === 'won' || b.result === 'lost');
    const won     = settled.filter(b => b.result === 'won');
    const profit  = settled.reduce((s, b) => s + calcProfit(b), 0);
    return {
      ...u, total: ub.length, settled: settled.length, won: won.length,
      profit: +profit.toFixed(2),
      winRate: settled.length > 0 ? +(won.length / settled.length * 100).toFixed(1) : 0,
    };
  });

  res.json({ users: usersWithStats, totalBets: bets.length, totalUsers: users.length });
});

router.post('/users', async (req, res) => {
  const { email, password, is_admin } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Informe email e senha.' });
  if (password.length < 8) return res.status(400).json({ error: 'A senha deve ter ao menos 8 caracteres.' });

  const password_hash = await hashPassword(password);
  try {
    const { rows } = await pool.query(
      'INSERT INTO users (email, password_hash, is_admin) VALUES ($1, $2, $3) RETURNING id, email, is_admin, created_at',
      [email, password_hash, !!is_admin]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Já existe um usuário com esse email.' });
    throw err;
  }
});

router.put('/users/:id/password', async (req, res) => {
  const { password } = req.body || {};
  if (!password || password.length < 8) return res.status(400).json({ error: 'A senha deve ter ao menos 8 caracteres.' });

  const password_hash = await hashPassword(password);
  const { rows } = await pool.query(
    'UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING id, email',
    [password_hash, req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Usuário não encontrado.' });
  res.json({ ok: true });
});

module.exports = router;
