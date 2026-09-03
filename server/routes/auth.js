const express = require('express');
const { pool } = require('../db');
const { comparePassword, signToken, setAuthCookie, clearAuthCookie, requireAuth } = require('../auth');

const router = express.Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Informe email e senha.' });

  const { rows } = await pool.query('SELECT id, email, password_hash, is_admin FROM users WHERE email = $1', [email]);
  const user = rows[0];
  const ok = user && await comparePassword(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Email ou senha incorretos.' });

  const token = signToken(user);
  setAuthCookie(res, token);
  res.json({ id: user.id, email: user.email, is_admin: user.is_admin });
});

router.post('/logout', (req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

router.get('/me', requireAuth, (req, res) => {
  res.json(req.user);
});

module.exports = router;
