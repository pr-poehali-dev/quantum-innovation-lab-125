CREATE TABLE t_p21475602_quantum_innovation_l.tg_subscribers (
  id SERIAL PRIMARY KEY,
  chat_id BIGINT NOT NULL UNIQUE,
  staff_id INTEGER NOT NULL REFERENCES t_p21475602_quantum_innovation_l.staff_users(id),
  tg_username TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE t_p21475602_quantum_innovation_l.tg_link_codes (
  code TEXT PRIMARY KEY,
  staff_id INTEGER NOT NULL REFERENCES t_p21475602_quantum_innovation_l.staff_users(id),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE t_p21475602_quantum_innovation_l.tg_message_map (
  chat_id BIGINT NOT NULL,
  tg_message_id BIGINT NOT NULL,
  client_id INTEGER,
  guest_id INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (chat_id, tg_message_id)
);