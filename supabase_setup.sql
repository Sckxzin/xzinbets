-- ============================================================
-- BetTracker Pro v3 — Execute no SQL Editor do Supabase
-- ============================================================

-- 1. Limpar tabelas anteriores
DROP TABLE IF EXISTS bet_legs CASCADE;
DROP TABLE IF EXISTS bets CASCADE;
DROP TABLE IF EXISTS tipsters CASCADE;
DROP TABLE IF EXISTS settings CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 2. Criar tabelas com user_id
CREATE TABLE tipsters (
  id SERIAL PRIMARY KEY, user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL, notes TEXT DEFAULT '', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, name)
);

CREATE TABLE bets (
  id SERIAL PRIMARY KEY, user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'single', sport TEXT NOT NULL, description TEXT NOT NULL,
  house TEXT NOT NULL, market TEXT NOT NULL, odd NUMERIC(8,4) NOT NULL, stake NUMERIC(10,2) NOT NULL,
  date DATE NOT NULL, result TEXT NOT NULL DEFAULT 'pending'
    CHECK (result IN ('pending','won','lost','void')),
  notes TEXT DEFAULT '', tipster_id INTEGER REFERENCES tipsters(id) ON DELETE SET NULL,
  estimated_prob NUMERIC(5,4), is_value BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE bet_legs (
  id SERIAL PRIMARY KEY, bet_id INTEGER NOT NULL REFERENCES bets(id) ON DELETE CASCADE,
  description TEXT NOT NULL, sport TEXT NOT NULL, market TEXT NOT NULL,
  odd NUMERIC(8,4) NOT NULL, result TEXT NOT NULL DEFAULT 'pending'
  CHECK (result IN ('pending','won','lost','void'))
);

CREATE TABLE settings (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key TEXT NOT NULL, value TEXT NOT NULL, PRIMARY KEY (user_id, key)
);

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Índices
CREATE INDEX idx_bets_user     ON bets(user_id);
CREATE INDEX idx_bets_date     ON bets(date DESC);
CREATE INDEX idx_bets_result   ON bets(result);
CREATE INDEX idx_tipsters_user ON tipsters(user_id);

-- 4. RLS
ALTER TABLE tipsters ENABLE ROW LEVEL SECURITY;
ALTER TABLE bets     ENABLE ROW LEVEL SECURITY;
ALTER TABLE bet_legs ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tipsters_own" ON tipsters USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
CREATE POLICY "bets_own"     ON bets     USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
CREATE POLICY "settings_own" ON settings USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
CREATE POLICY "bet_legs_own" ON bet_legs USING (bet_id IN (SELECT id FROM bets WHERE user_id=auth.uid()));
CREATE POLICY "profiles_own" ON profiles USING (auth.uid()=id);

-- 5. Trigger para criar perfil automaticamente
CREATE OR REPLACE FUNCTION handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles(id,email) VALUES (NEW.id,NEW.email) ON CONFLICT(id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

SELECT 'Setup concluído! ✅' AS status;
