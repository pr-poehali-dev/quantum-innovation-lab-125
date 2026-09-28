-- 7. Документы теперь приватные и привязаны к клиенту (не публикуются на лендинге)
ALTER TABLE t_p21475602_quantum_innovation_l.documents
  ADD COLUMN client_id INTEGER NULL REFERENCES t_p21475602_quantum_innovation_l.clients(id);
CREATE INDEX idx_documents_client ON t_p21475602_quantum_innovation_l.documents(client_id);
