CREATE TABLE t_p21475602_quantum_innovation_l.contacts (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE,
  company TEXT NOT NULL,
  segment TEXT,
  city TEXT,
  call_window TEXT,
  priority SMALLINT,
  phone TEXT,
  email TEXT,
  call_status TEXT NOT NULL DEFAULT 'new',
  need TEXT,
  volume_note TEXT,
  important TEXT,
  mailing_consent BOOLEAN NOT NULL DEFAULT FALSE,
  assigned_to INTEGER REFERENCES t_p21475602_quantum_innovation_l.staff_users(id),
  client_id INTEGER REFERENCES t_p21475602_quantum_innovation_l.clients(id),
  last_call_at TIMESTAMPTZ,
  next_call_at TIMESTAMPTZ,
  archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE t_p21475602_quantum_innovation_l.contact_tags (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT 'gray',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE t_p21475602_quantum_innovation_l.contact_tag_links (
  contact_id INTEGER NOT NULL REFERENCES t_p21475602_quantum_innovation_l.contacts(id),
  tag_id INTEGER NOT NULL REFERENCES t_p21475602_quantum_innovation_l.contact_tags(id),
  PRIMARY KEY (contact_id, tag_id)
);

CREATE TABLE t_p21475602_quantum_innovation_l.contact_comments (
  id SERIAL PRIMARY KEY,
  contact_id INTEGER NOT NULL REFERENCES t_p21475602_quantum_innovation_l.contacts(id),
  staff_id INTEGER,
  staff_name TEXT,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE t_p21475602_quantum_innovation_l.contact_calls (
  id SERIAL PRIMARY KEY,
  contact_id INTEGER NOT NULL REFERENCES t_p21475602_quantum_innovation_l.contacts(id),
  staff_id INTEGER,
  staff_name TEXT,
  result TEXT NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contacts_priority ON t_p21475602_quantum_innovation_l.contacts(priority);
CREATE INDEX idx_contacts_status ON t_p21475602_quantum_innovation_l.contacts(call_status);
CREATE INDEX idx_contact_comments_contact ON t_p21475602_quantum_innovation_l.contact_comments(contact_id);
CREATE INDEX idx_contact_calls_contact ON t_p21475602_quantum_innovation_l.contact_calls(contact_id);