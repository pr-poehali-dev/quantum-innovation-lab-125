ALTER TABLE t_p21475602_quantum_innovation_l.deals ADD COLUMN trashed_at TIMESTAMPTZ NULL;
ALTER TABLE t_p21475602_quantum_innovation_l.deals ADD COLUMN trashed_by TEXT NULL;
CREATE INDEX idx_deals_trashed_at ON t_p21475602_quantum_innovation_l.deals(trashed_at);