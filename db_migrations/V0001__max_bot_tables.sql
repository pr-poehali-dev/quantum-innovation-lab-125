CREATE TABLE t_p21475602_quantum_innovation_l.max_subscribers (
  user_id bigint PRIMARY KEY,
  staff_id integer NOT NULL REFERENCES t_p21475602_quantum_innovation_l.staff_users(id),
  username text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE t_p21475602_quantum_innovation_l.max_message_map (
  mid text PRIMARY KEY,
  client_id integer NULL,
  guest_id integer NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE t_p21475602_quantum_innovation_l.max_link_codes (
  code text PRIMARY KEY,
  staff_id integer NOT NULL REFERENCES t_p21475602_quantum_innovation_l.staff_users(id),
  expires_at timestamptz NOT NULL
);