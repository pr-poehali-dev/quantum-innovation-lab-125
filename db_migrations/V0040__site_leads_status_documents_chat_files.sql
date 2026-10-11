ALTER TABLE t_p21475602_quantum_innovation_l.leads ADD COLUMN status TEXT NOT NULL DEFAULT 'new';
UPDATE t_p21475602_quantum_innovation_l.leads SET status = 'converted'
WHERE id IN (SELECT lead_id FROM t_p21475602_quantum_innovation_l.deals WHERE lead_id IS NOT NULL);

CREATE TABLE t_p21475602_quantum_innovation_l.doc_templates (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE
);
INSERT INTO t_p21475602_quantum_innovation_l.doc_templates (title, sort_order) VALUES
  ('Договор', 1), ('Спецификация', 2), ('Счёт на оплату', 3), ('Акт', 4), ('УПД', 5);

CREATE TABLE t_p21475602_quantum_innovation_l.deal_documents (
  id SERIAL PRIMARY KEY,
  deal_id INTEGER NOT NULL REFERENCES t_p21475602_quantum_innovation_l.deals(id),
  client_id INTEGER NOT NULL REFERENCES t_p21475602_quantum_innovation_l.clients(id),
  template_id INTEGER REFERENCES t_p21475602_quantum_innovation_l.doc_templates(id),
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'todo',
  file_url TEXT,
  file_name TEXT,
  signed_file_url TEXT,
  signed_file_name TEXT,
  sent_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  completed_by TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_deal_documents_deal ON t_p21475602_quantum_innovation_l.deal_documents(deal_id);
CREATE INDEX idx_deal_documents_client ON t_p21475602_quantum_innovation_l.deal_documents(client_id);

ALTER TABLE t_p21475602_quantum_innovation_l.messages ADD COLUMN kind TEXT NOT NULL DEFAULT 'text';
ALTER TABLE t_p21475602_quantum_innovation_l.messages ADD COLUMN doc_id INTEGER REFERENCES t_p21475602_quantum_innovation_l.deal_documents(id);
ALTER TABLE t_p21475602_quantum_innovation_l.messages ADD COLUMN file_url TEXT;
ALTER TABLE t_p21475602_quantum_innovation_l.messages ADD COLUMN file_name TEXT;