-- ============================================================
-- BetTracker Pro v4 — Schema Postgres (Railway)
-- Execute uma vez contra o banco (ex: psql "$DATABASE_URL" -f db/schema.sql)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email              TEXT NOT NULL UNIQUE,
  password_hash      TEXT NOT NULL,
  recovery_code_hash TEXT,
  is_admin           BOOLEAN NOT NULL DEFAULT FALSE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Rodando contra um banco já existente (criado antes desta coluna existir),
-- rode manualmente: ALTER TABLE users ADD COLUMN IF NOT EXISTS recovery_code_hash TEXT;

CREATE TABLE IF NOT EXISTS tipsters (
  id         SERIAL PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  notes      TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, name)
);

CREATE TABLE IF NOT EXISTS bets (
  id             SERIAL PRIMARY KEY,
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type           TEXT NOT NULL DEFAULT 'single',
  sport          TEXT NOT NULL,
  description    TEXT NOT NULL,
  house          TEXT NOT NULL,
  market         TEXT NOT NULL,
  odd            NUMERIC(8,4) NOT NULL,
  stake          NUMERIC(10,2) NOT NULL,
  date           DATE NOT NULL,
  result         TEXT NOT NULL DEFAULT 'pending'
    CHECK (result IN ('pending','won','lost','void')),
  notes          TEXT DEFAULT '',
  tipster_id     INTEGER REFERENCES tipsters(id) ON DELETE SET NULL,
  estimated_prob NUMERIC(5,4),
  is_value       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bet_legs (
  id          SERIAL PRIMARY KEY,
  bet_id      INTEGER NOT NULL REFERENCES bets(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  sport       TEXT NOT NULL,
  market      TEXT NOT NULL,
  odd         NUMERIC(8,4) NOT NULL,
  result      TEXT NOT NULL DEFAULT 'pending'
    CHECK (result IN ('pending','won','lost','void'))
);

CREATE TABLE IF NOT EXISTS settings (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key     TEXT NOT NULL,
  value   TEXT NOT NULL,
  PRIMARY KEY (user_id, key)
);

CREATE INDEX IF NOT EXISTS idx_bets_user     ON bets(user_id);
CREATE INDEX IF NOT EXISTS idx_bets_date     ON bets(date DESC);
CREATE INDEX IF NOT EXISTS idx_bets_result   ON bets(result);
CREATE INDEX IF NOT EXISTS idx_tipsters_user ON tipsters(user_id);
CREATE INDEX IF NOT EXISTS idx_bet_legs_bet  ON bet_legs(bet_id);

-- Não há Row Level Security aqui: o isolamento por usuário é garantido
-- pela API (server/), que sempre filtra as queries por user_id a partir
-- do token JWT autenticado. Não existe acesso direto do navegador ao banco.
