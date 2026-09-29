CREATE TABLE t_p21475602_quantum_innovation_l.deal_notes (
  id SERIAL PRIMARY KEY,
  deal_id INTEGER NOT NULL REFERENCES t_p21475602_quantum_innovation_l.deals(id),
  text TEXT NOT NULL,
  staff_id INTEGER REFERENCES t_p21475602_quantum_innovation_l.staff_users(id),
  staff_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_deal_notes_deal_id ON t_p21475602_quantum_innovation_l.deal_notes(deal_id);