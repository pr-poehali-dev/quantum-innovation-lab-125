ALTER TABLE t_p21475602_quantum_innovation_l.staff_sessions
  ADD COLUMN preview_role TEXT CHECK (preview_role IN ('manager', 'support'));