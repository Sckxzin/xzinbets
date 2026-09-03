const { Pool, types } = require('pg');

// node-postgres, por padrão, converte colunas DATE em objetos JS Date (à
// meia-noite UTC), o que quebra comparações por string tipo "YYYY-MM"
// e o valor esperado por <input type="date">. Mantemos como string crua
// ("YYYY-MM-DD"), igual ao que o Supabase/PostgREST retornava antes.
types.setTypeParser(types.builtins.DATE, (val) => val);

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL ausente. Configure a variável de ambiente com a connection ' +
    'string do Postgres (ex: a fornecida pelo plugin Postgres do Railway).'
  );
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false },
});

module.exports = { pool };
