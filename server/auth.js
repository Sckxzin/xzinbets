const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const crypto = require('crypto');

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET ausente. Defina uma string aleatória longa nessa variável de ambiente.');
}

const JWT_SECRET = process.env.JWT_SECRET;
const COOKIE_NAME = 'token';
const TOKEN_TTL = '30d';

function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

// Alfabeto sem caracteres ambíguos (0/O, 1/l/I) para facilitar leitura na hora
// de repassar a senha por WhatsApp/etc.
const PASSWORD_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';

function generatePassword(length = 14) {
  let out = '';
  for (let i = 0; i < length; i++) out += PASSWORD_ALPHABET[crypto.randomInt(PASSWORD_ALPHABET.length)];
  return out;
}

function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email, is_admin: user.is_admin }, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
}

function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME);
}

function requireAuth(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return res.status(401).json({ error: 'Não autenticado.' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: payload.sub, email: payload.email, is_admin: !!payload.is_admin };
    next();
  } catch {
    return res.status(401).json({ error: 'Sessão inválida ou expirada.' });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user?.is_admin) return res.status(403).json({ error: 'Acesso restrito ao administrador.' });
  next();
}

module.exports = {
  hashPassword, comparePassword, generatePassword, signToken,
  setAuthCookie, clearAuthCookie, requireAuth, requireAdmin,
  COOKIE_NAME,
};
