const express = require('express');
const { pool } = require('../db');
const { comparePassword, hashPassword, signToken, setAuthCookie, clearAuthCookie, requireAuth } = require('../auth');

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

router.put('/password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Informe a senha atual e a nova senha.' });
  if (newPassword.length < 8) return res.status(400).json({ error: 'A nova senha deve ter ao menos 8 caracteres.' });

  const { rows } = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
  const ok = rows[0] && await comparePassword(currentPassword, rows[0].password_hash);
  if (!ok) return res.status(401).json({ error: 'Senha atual incorreta.' });

  const password_hash = await hashPassword(newPassword);
  await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [password_hash, req.user.id]);
  res.json({ ok: true });
});

module.exports = router;
