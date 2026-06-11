CREATE TABLE IF NOT EXISTS leads (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  phone       TEXT NOT NULL,
  city        TEXT,
  email       TEXT,
  source      TEXT DEFAULT 'site',
  brief       JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);