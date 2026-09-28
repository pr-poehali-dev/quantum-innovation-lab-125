-- 6. Гостевой чат (неавторизованные посетители сайта) — отдельные таблицы, чтобы не трогать messages
CREATE TABLE t_p21475602_quantum_innovation_l.guest_sessions (
  id           SERIAL PRIMARY KEY,
  token        TEXT NOT NULL UNIQUE,
  name         TEXT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE t_p21475602_quantum_innovation_l.guest_messages (
  id          SERIAL PRIMARY KEY,
  guest_id    INTEGER NOT NULL REFERENCES t_p21475602_quantum_innovation_l.guest_sessions(id),
  sender_type TEXT NOT NULL,
  staff_id    INTEGER NULL REFERENCES t_p21475602_quantum_innovation_l.staff_users(id),
  body        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at     TIMESTAMPTZ NULL
);
ALTER TABLE t_p21475602_quantum_innovation_l.guest_messages
  ADD CONSTRAINT chk_guest_msg_sender CHECK (sender_type IN ('guest', 'staff'));
CREATE INDEX idx_guest_messages_guest ON t_p21475602_quantum_innovation_l.guest_messages(guest_id, created_at);
