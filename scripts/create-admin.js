// Cria (ou promove a admin) um usuário diretamente no banco.
// Uso: npm run create-admin -- email@exemplo.com senhaForte123
require('dotenv').config();
const { pool } = require('../server/db');
const { hashPassword } = require('../server/auth');

async function main() {
  const [email, password] = process.argv.slice(2);
  if (!email || !password) {
    console.error('Uso: npm run create-admin -- <email> <senha>');
    process.exit(1);
  }
  if (password.length < 8) {
    console.error('A senha deve ter ao menos 8 caracteres.');
    process.exit(1);
  }

  const password_hash = await hashPassword(password);
  const { rows } = await pool.query(
    `INSERT INTO users (email, password_hash, is_admin) VALUES ($1, $2, TRUE)
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, is_admin = TRUE
     RETURNING id, email, is_admin`,
    [email, password_hash]
  );
  console.log('Admin pronto:', rows[0]);
  await pool.end();
}

main().catch(err => { console.error(err); process.exit(1); });
