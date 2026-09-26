-- Сотрудники (закрытая админка)
CREATE TABLE t_p21475602_quantum_innovation_l.staff_users (
  id            SERIAL PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  is_owner      BOOLEAN NOT NULL DEFAULT FALSE,
  active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE t_p21475602_quantum_innovation_l.staff_invites (
  id          SERIAL PRIMARY KEY,
  email       TEXT NOT NULL,
  token       TEXT UNIQUE NOT NULL,
  invited_by  INTEGER REFERENCES t_p21475602_quantum_innovation_l.staff_users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ
);

CREATE TABLE t_p21475602_quantum_innovation_l.staff_sessions (
  id         SERIAL PRIMARY KEY,
  staff_id   INTEGER NOT NULL REFERENCES t_p21475602_quantum_innovation_l.staff_users(id),
  token      TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- Этапы сделок (редактируемая воронка)
CREATE TABLE t_p21475602_quantum_innovation_l.deal_stages (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  color      TEXT NOT NULL DEFAULT '#a16207',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO t_p21475602_quantum_innovation_l.deal_stages (name, sort_order, color) VALUES
  ('Новая заявка',    1, '#64748b'),
  ('Бриф согласован', 2, '#0ea5e9'),
  ('Договор',         3, '#8b5cf6'),
  ('Производство',    4, '#f59e0b'),
  ('Отгрузка',        5, '#22c55e'),
  ('Завершено',       6, '#16a34a');

-- Клиенты
CREATE TABLE t_p21475602_quantum_innovation_l.clients (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  phone      TEXT,
  email      TEXT,
  city       TEXT,
  company    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Сделки клиента
CREATE TABLE t_p21475602_quantum_innovation_l.deals (
  id         SERIAL PRIMARY KEY,
  client_id  INTEGER NOT NULL REFERENCES t_p21475602_quantum_innovation_l.clients(id),
  lead_id    INTEGER REFERENCES t_p21475602_quantum_innovation_l.leads(id),
  brand      TEXT,
  volume     NUMERIC,
  amount     NUMERIC,
  stage_id   INTEGER NOT NULL REFERENCES t_p21475602_quantum_innovation_l.deal_stages(id),
  created_by INTEGER REFERENCES t_p21475602_quantum_innovation_l.staff_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- История изменений этапов сделки
CREATE TABLE t_p21475602_quantum_innovation_l.deal_stage_log (
  id            SERIAL PRIMARY KEY,
  deal_id       INTEGER NOT NULL REFERENCES t_p21475602_quantum_innovation_l.deals(id),
  from_stage_id INTEGER REFERENCES t_p21475602_quantum_innovation_l.deal_stages(id),
  to_stage_id   INTEGER NOT NULL REFERENCES t_p21475602_quantum_innovation_l.deal_stages(id),
  staff_id      INTEGER REFERENCES t_p21475602_quantum_innovation_l.staff_users(id),
  staff_name    TEXT,
  changed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Вход клиента в личный кабинет по email-коду
CREATE TABLE t_p21475602_quantum_innovation_l.client_login_codes (
  id         SERIAL PRIMARY KEY,
  email      TEXT NOT NULL,
  code       TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE t_p21475602_quantum_innovation_l.client_sessions (
  id         SERIAL PRIMARY KEY,
  email      TEXT NOT NULL,
  token      TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_deals_client_id ON t_p21475602_quantum_innovation_l.deals(client_id);
CREATE INDEX idx_clients_email ON t_p21475602_quantum_innovation_l.clients(email);
CREATE INDEX idx_clients_phone ON t_p21475602_quantum_innovation_l.clients(phone);
